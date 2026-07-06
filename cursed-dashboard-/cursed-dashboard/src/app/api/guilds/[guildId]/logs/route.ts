import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection } from "@/lib/db";
import { fetchGuildChannels } from "@/lib/discord";
import { logsConfigSchema } from "@/lib/validation/logs";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_LOGS_CONFIG, LOG_CATEGORY_META } from "@/types/logs";
import type { LogCategoryKey } from "@/types/logs";
import type { DiscordChannel } from "@/types/discord";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

/**
 * GET /api/guilds/[guildId]/logs
 *
 * Returns the guild's current logging config (or the documented defaults if
 * it has never been saved) plus a best-effort list of text channels for the
 * per-category channel selectors. Read-only — this never reads Discord's
 * audit log and never imports or calls into the bot process.
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
      { projection: { logs: 1 } }
    );

    return NextResponse.json({
      config: doc?.logs ?? DEFAULT_LOGS_CONFIG,
      // null (not []) tells the UI "couldn't load channels, fall back to
      // manual entry" — distinct from "this guild genuinely has none".
      channels: channels as DiscordChannel[] | null,
    });
  } catch (err) {
    console.error("[GET /api/guilds/:guildId/logs]", err);
    return NextResponse.json(
      { error: "Couldn't load logging settings. Try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guilds/[guildId]/logs
 *
 * Validates and persists the guild's logging config. This is a pure config
 * write to MongoDB: it never reads or writes Discord's audit log, never
 * opens a gateway connection, and never posts a message anywhere. The bot
 * reads this same `guildConfigs` document on its own schedule (see
 * docs/ARCHITECTURE.md) and decides for itself when to emit a log entry.
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
    config = logsConfigSchema.parse(bodyResult.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return zodErrorResponse(err);
    }
    throw err;
  }

  // Guild-scoped channel validation: if we can see the guild's real channel
  // list, make sure every category's chosen channel actually belongs to it
  // and is text-capable. One fetch covers every category. If the bot isn't
  // in the guild yet (or the lookup fails), we can't do this check — the
  // format-level regex in the schema still applies, and the bot will simply
  // skip logging to a channel that turns out to be invalid.
  const channels = await fetchGuildChannels(guildId);
  if (channels) {
    const validIds = new Set(channels.map((c) => c.id));
    const fieldErrors: Record<string, string[]> = {};

    for (const key of Object.keys(config) as LogCategoryKey[]) {
      const category = config[key];
      if (category.channelId && !validIds.has(category.channelId)) {
        fieldErrors[key] = [
          `Select a channel from this server's list for "${LOG_CATEGORY_META[key].label}".`,
        ];
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: "One or more log channels don't belong to this server.",
          fieldErrors,
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
          logs: config,
          updatedAt: new Date(),
          logsUpdatedBy: access.userId,
        },
        $setOnInsert: { guildId },
      },
      { upsert: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[PUT /api/guilds/:guildId/logs]", err);
    return NextResponse.json(
      { error: "Couldn't save logging settings. Try again shortly." },
      { status: 500 }
    );
  }
}
