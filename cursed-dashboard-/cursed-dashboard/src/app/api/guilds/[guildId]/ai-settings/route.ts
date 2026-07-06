import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection } from "@/lib/db";
import { aiSettingsConfigSchema } from "@/lib/validation/ai-settings";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_AI_SETTINGS_CONFIG } from "@/types/ai-settings";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

/**
 * GET /api/guilds/[guildId]/ai-settings
 *
 * Returns the guild's current AI settings (or the documented defaults if
 * it has never been saved). Unlike Welcome/Autorole this feature has no
 * Discord-side data to cross-reference (no channels/roles), so this route
 * only ever reads from MongoDB — no Discord API calls, no bot import, no AI
 * provider is ever called from here.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const collection = await getGuildConfigsCollection();
    const doc = await collection.findOne(
      { guildId },
      { projection: { aiSettings: 1 } }
    );

    return NextResponse.json({
      config: doc?.aiSettings ?? DEFAULT_AI_SETTINGS_CONFIG,
    });
  } catch (err) {
    console.error("[GET /api/guilds/:guildId/ai-settings]", err);
    return NextResponse.json(
      { error: "Couldn't load AI settings. Try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guilds/[guildId]/ai-settings
 *
 * Validates and persists the guild's AI settings. This is a pure config
 * write to MongoDB: it never calls any AI provider (Groq/Gemini/etc.) and
 * never talks to the bot process. The bot reads this same `guildConfigs`
 * document on its own schedule (see docs/ARCHITECTURE.md) and is the only
 * thing that actually makes AI calls. Client input is never trusted —
 * everything is re-validated here with the same Zod schema the client
 * uses, server-side, regardless of what the request body claims.
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
    config = aiSettingsConfigSchema.parse(bodyResult.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return zodErrorResponse(err);
    }
    throw err;
  }

  try {
    const collection = await getGuildConfigsCollection();
    await collection.updateOne(
      { guildId },
      {
        $set: {
          aiSettings: config,
          updatedAt: new Date(),
          aiSettingsUpdatedBy: access.userId,
        },
        $setOnInsert: { guildId },
      },
      { upsert: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[PUT /api/guilds/:guildId/ai-settings]", err);
    return NextResponse.json(
      { error: "Couldn't save AI settings. Try again shortly." },
      { status: 500 }
    );
  }
}
