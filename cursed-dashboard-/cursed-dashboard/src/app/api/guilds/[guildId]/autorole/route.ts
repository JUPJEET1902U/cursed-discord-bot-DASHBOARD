import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { getGuildConfigsCollection } from "@/lib/db";
import { fetchBotHighestRolePosition, fetchGuildRoles } from "@/lib/discord";
import { autoroleConfigSchema } from "@/lib/validation/autorole";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { DEFAULT_AUTOROLE_CONFIG } from "@/types/autorole";
import type { DiscordRole } from "@/types/discord";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

/**
 * GET /api/guilds/[guildId]/autorole
 *
 * Returns the guild's current autorole config (or defaults), the guild's
 * full role list for the picker, and the bot's own highest role position
 * so the UI can render hierarchy warnings. Read-only — no role is ever
 * assigned here, and this never imports or calls into the bot process.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const [collection, roles] = await Promise.all([
      getGuildConfigsCollection(),
      fetchGuildRoles(guildId),
    ]);

    const botHighestRolePosition = roles
      ? await fetchBotHighestRolePosition(guildId, roles)
      : null;

    const doc = await collection.findOne(
      { guildId },
      { projection: { autorole: 1 } }
    );

    return NextResponse.json({
      config: doc?.autorole ?? DEFAULT_AUTOROLE_CONFIG,
      // null tells the UI "couldn't load roles" (bot not in guild / no
      // token configured yet) — distinct from "this guild has zero roles".
      roles: roles as DiscordRole[] | null,
      botHighestRolePosition,
    });
  } catch (err) {
    console.error("[GET /api/guilds/:guildId/autorole]", err);
    return NextResponse.json(
      { error: "Couldn't load autorole settings. Try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guilds/[guildId]/autorole
 *
 * Validates and persists the guild's autorole config. Pure config write to
 * MongoDB — no role is assigned to any member from this repo. The bot reads
 * this same `guildConfigs` document independently and performs the actual
 * Discord role-assignment calls itself.
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
    config = autoroleConfigSchema.parse(bodyResult.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return zodErrorResponse(err);
    }
    throw err;
  }

  // Guild-scoped role validation: if we can see the guild's real role list,
  // reject anything that isn't actually a normal, assignable role in this
  // guild. This is the server-side backstop behind the client's own
  // checks — the client can be bypassed, this can't.
  if (config.roleIds.length > 0) {
    const roles = await fetchGuildRoles(guildId);
    if (roles) {
      const byId = new Map(roles.map((r) => [r.id, r]));
      for (const roleId of config.roleIds) {
        const role = byId.get(roleId);
        if (!role) {
          return NextResponse.json(
            {
              error: "One or more selected roles no longer exist in this server.",
              fieldErrors: { roleIds: ["Remove roles that no longer exist and try again."] },
            },
            { status: 422 }
          );
        }
        if (roleId === guildId) {
          return NextResponse.json(
            {
              error: "@everyone can't be used as an autorole.",
              fieldErrors: { roleIds: ["@everyone can't be used as an autorole."] },
            },
            { status: 422 }
          );
        }
        if (role.managed) {
          return NextResponse.json(
            {
              error: `"${role.name}" is managed by an integration and can't be assigned manually.`,
              fieldErrors: { roleIds: [`"${role.name}" is a managed role and can't be used.`] },
            },
            { status: 422 }
          );
        }
      }
    }
    // If `roles` is null (bot not in guild / no token), we can't do this
    // check yet — the schema's snowflake-format check still applies, and
    // the bot will simply skip any role it can't resolve when it reads
    // this config later.
  }

  try {
    const collection = await getGuildConfigsCollection();
    await collection.updateOne(
      { guildId },
      {
        $set: {
          autorole: config,
          updatedAt: new Date(),
          autoroleUpdatedBy: access.userId,
        },
        $setOnInsert: { guildId },
      },
      { upsert: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[PUT /api/guilds/:guildId/autorole]", err);
    return NextResponse.json(
      { error: "Couldn't save autorole settings. Try again shortly." },
      { status: 500 }
    );
  }
}
