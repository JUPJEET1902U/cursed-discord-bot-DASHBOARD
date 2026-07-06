import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection, getPremiumEntitlementsCollection } from "@/lib/db";
import { guildSettingsSchema } from "@/lib/validation/settings";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_GUILD_SETTINGS } from "@/types/guild-settings";
import { DEFAULT_PREMIUM_STATUS, type PremiumStatus } from "@/types/premium";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

/**
 * GET /api/guilds/[guildId]/settings
 *
 * Returns the guild's current settings (or the documented defaults if
 * they've never been saved) plus a read-only premium status snapshot. Pure
 * read — no Discord call, no bot process involved.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const [configCollection, premiumCollection] = await Promise.all([
      getGuildConfigsCollection(),
      getPremiumEntitlementsCollection(),
    ]);

    const [configDoc, premiumDoc] = await Promise.all([
      configCollection.findOne({ guildId }, { projection: { settings: 1 } }),
      premiumCollection.findOne({ guildId }),
    ]);

    const premium: PremiumStatus = premiumDoc
      ? {
          active: premiumDoc.active,
          plan: premiumDoc.plan ?? null,
          expiresAt: premiumDoc.expiresAt
            ? new Date(premiumDoc.expiresAt).toISOString()
            : null,
        }
      : DEFAULT_PREMIUM_STATUS;

    return NextResponse.json({
      config: configDoc?.settings ?? DEFAULT_GUILD_SETTINGS,
      premium,
    });
  } catch (err) {
    console.error("[GET /api/guilds/:guildId/settings]", err);
    return NextResponse.json(
      { error: "Couldn't load server settings. Try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guilds/[guildId]/settings
 *
 * Validates and persists the guild's server-wide settings. Pure config
 * write to MongoDB: no Discord API call (this never renames the guild),
 * no bot process involved. The bot reads this same `guildConfigs` document
 * on its own schedule (see docs/ARCHITECTURE.md) and applies these as its
 * defaults/fallbacks.
 *
 * Premium status is intentionally NOT accepted here — `guildSettingsSchema`
 * only knows about `general`/`aiDefaults`/`moderationDefaults`, so a
 * `premium` key in the request body is silently stripped by Zod rather than
 * persisted. Premium is read-only from this dashboard's perspective.
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
    config = guildSettingsSchema.parse(bodyResult.body);
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
          settings: config,
          updatedAt: new Date(),
          settingsUpdatedBy: access.userId,
        },
        $setOnInsert: { guildId },
      },
      { upsert: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[PUT /api/guilds/:guildId/settings]", err);
    return NextResponse.json(
      { error: "Couldn't save server settings. Try again shortly." },
      { status: 500 }
    );
  }
}
