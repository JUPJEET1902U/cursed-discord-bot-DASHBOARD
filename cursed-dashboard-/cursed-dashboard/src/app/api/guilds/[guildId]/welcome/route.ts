import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection } from "@/lib/db";
import { fetchGuildChannels } from "@/lib/discord";
import { welcomeConfigSchema } from "@/lib/validation/welcome";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_WELCOME_CONFIG } from "@/types/welcome";
import type { DiscordChannel } from "@/types/discord";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

/**
 * GET /api/guilds/[guildId]/welcome
 *
 * Returns the guild's current welcome config (or the documented defaults if
 * it has never been saved) plus a best-effort list of text channels for the
 * channel selector. This route only ever reads — no message is composed or
 * sent, and it never imports or calls into the bot process.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const [collection, channels] = await Promise.all([
      getGuildConfigsCollection(),
      fetchGuildChannels(guildId),
    ]);

    const doc = await collection.findOne(
      { guildId },
      { projection: { welcome: 1 } }
    );

    return NextResponse.json({
      config: doc?.welcome ?? DEFAULT_WELCOME_CONFIG,
      // null (not []) tells the UI "couldn't load channels, fall back to
      // manual entry" — distinct from "this guild genuinely has none".
      channels: channels as DiscordChannel[] | null,
    });
  } catch (err) {
    console.error("[GET /api/guilds/:guildId/welcome]", err);
    return NextResponse.json(
      { error: "Couldn't load welcome settings. Try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guilds/[guildId]/welcome
 *
 * Validates and persists the guild's welcome config. This is a pure config
 * write to MongoDB: it never sends a Discord message and never talks to the
 * bot process. The bot reads this same `guildConfigs` document on its own
 * schedule (see docs/ARCHITECTURE.md).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  let config;
  try {
    config = welcomeConfigSchema.parse(bodyResult.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return zodErrorResponse(err);
    }
    throw err;
  }

  // Extra guild-scoped validation: if we can see the guild's real channel
  // list, make sure the chosen channel actually belongs to it and is a text
  // channel. If the bot isn't in the guild yet (or the lookup fails), we
  // can't do this check — the format-level regex in the schema still
  // applies, and the bot will simply skip sending if the channel turns out
  // to be invalid when it reads this config.
  if (config.channelId) {
    const channels = await fetchGuildChannels(guildId);
    if (channels && !channels.some((c) => c.id === config.channelId)) {
      return NextResponse.json(
        {
          error: "That channel doesn't belong to this server.",
          fieldErrors: { channelId: ["Select a channel from this server's list."] },
        },
        { status: 422 }
      );
    }
  }

  try {
    const collection = await getGuildConfigsCollection();
    await collection.updateOne(
      { guildId },
      {
        $set: {
          welcome: config,
          updatedAt: new Date(),
          welcomeUpdatedBy: access.userId,
        },
        $setOnInsert: { guildId },
      },
      { upsert: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[PUT /api/guilds/:guildId/welcome]", err);
    return NextResponse.json(
      { error: "Couldn't save welcome settings. Try again shortly." },
      { status: 500 }
    );
  }
}
