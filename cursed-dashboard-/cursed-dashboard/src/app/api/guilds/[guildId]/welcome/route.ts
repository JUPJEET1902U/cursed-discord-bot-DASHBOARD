import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection } from "@/lib/db";
import { fetchGuildChannels } from "@/lib/discord";
import { welcomeConfigSchema } from "@/lib/validation/welcome";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_WELCOME_CONFIG, type WelcomeConfig } from "@/types/welcome";
import type { DiscordChannel } from "@/types/discord";
import type { GuildConfigDocument } from "@/types/guild-config";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

const WELCOME_PROJECTION = {
  welcomeChannelId: 1,
  welcomeMessage: 1,
  welcomeUseAI: 1,
  welcomeColor: 1,
  welcomeThumbnail: 1,
  welcomeImageUrl: 1,
  welcomeFooter: 1,
} as const;

function fromDocument(doc: GuildConfigDocument | null): WelcomeConfig {
  if (!doc) return DEFAULT_WELCOME_CONFIG;

  return {
    welcomeChannelId: doc.welcomeChannelId ?? null,
    welcomeMessage: doc.welcomeMessage ?? null,
    welcomeUseAI: doc.welcomeUseAI ?? false,
    welcomeColor: doc.welcomeColor ?? null,
    welcomeThumbnail: doc.welcomeThumbnail !== false,
    welcomeImageUrl: doc.welcomeImageUrl ?? null,
    welcomeFooter: doc.welcomeFooter ?? null,
  };
}

/**
 * GET /api/guilds/[guildId]/welcome
 *
 * Returns the same top-level MongoDB guild config fields read by the live
 * bot's GuildConfigStore, plus a best-effort text-channel list.
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
      { projection: WELCOME_PROJECTION }
    );

    return NextResponse.json({
      config: fromDocument(doc),
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
 * Validates and persists only the exact top-level welcome fields read by the
 * live bot's GuildConfigStore. This never sends Discord messages and never
 * overwrites unrelated guild config fields.
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

  let config: WelcomeConfig;
  try {
    config = welcomeConfigSchema.parse(bodyResult.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return zodErrorResponse(err);
    }
    throw err;
  }

  if (config.welcomeChannelId) {
    const channels = await fetchGuildChannels(guildId);
    if (channels && !channels.some((c) => c.id === config.welcomeChannelId)) {
      return NextResponse.json(
        {
          error: "That channel doesn't belong to this server.",
          fieldErrors: {
            welcomeChannelId: ["Select a channel from this server's list."],
          },
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
          welcomeChannelId: config.welcomeChannelId,
          welcomeMessage: config.welcomeMessage,
          welcomeUseAI: config.welcomeUseAI,
          welcomeColor: config.welcomeColor,
          welcomeThumbnail: config.welcomeThumbnail,
          welcomeImageUrl: config.welcomeImageUrl,
          welcomeFooter: config.welcomeFooter,
          updatedAt: new Date(),
        },
        $unset: {
          // Remove the old dashboard-only nested draft shape if this guild had
          // been saved before the bot moved to the shared flat Mongo contract.
          welcome: "",
          welcomeUpdatedBy: "",
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
