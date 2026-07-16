import "server-only";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import {
  DiscordAuthError,
  canManageGuild,
  fetchUserGuilds,
} from "@/lib/discord";
import type { DiscordPartialGuild } from "@/types/discord";

const SNOWFLAKE = /^\d{17,20}$/;

export type GuildAccessResult =
  | { ok: true; guild: DiscordPartialGuild; userId: string }
  | { ok: false; status: number; error: string };

/**
 * The single security gate every `/api/guilds/[guildId]/**` route must call
 * before touching MongoDB. It:
 *
 *  1. Reads the session off the encrypted JWT (never trusts a client-sent
 *     user ID or header).
 *  2. Re-fetches the user's guild list straight from Discord on every call
 *     — the `guildId` in the URL is just a lookup key, never treated as
 *     proof the caller may act on it. A stale cookie, a guessed ID, or an
 *     ID copy-pasted from devtools all fail the same way: the guild simply
 *     won't be in this fresh list.
 *  3. Confirms `MANAGE_GUILD` (or ownership) on that specific guild.
 *
 * This mirrors exactly what `getSelectedGuild()` / `requireSelectedGuild()`
 * already do for page rendering (`src/lib/guild.ts`), but as a reusable
 * check for API route handlers, which don't have access to `redirect()`.
 */
export async function verifyGuildManageAccess(
  request: NextRequest,
  guildId: string
): Promise<GuildAccessResult> {
  if (!SNOWFLAKE.test(guildId)) {
    return { ok: false, status: 400, error: "Invalid guild ID." };
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.accessToken || !token.discordId) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  try {
    const guilds = await fetchUserGuilds(token.accessToken);
    const guild = guilds.find((g) => g.id === guildId);

    if (!guild) {
      return {
        ok: false,
        status: 404,
        error: "Server not found, or you're not a member of it.",
      };
    }
    if (!canManageGuild(guild)) {
      return {
        ok: false,
        status: 403,
        error: "You need the Manage Server permission to do this.",
      };
    }

    return { ok: true, guild, userId: token.discordId as string };
  } catch (err) {
    if (err instanceof DiscordAuthError) {
      return {
        ok: false,
        status: 401,
        error: "Discord session expired. Please sign in again.",
      };
    }
    console.error("[verifyGuildManageAccess]", err);
    return {
      ok: false,
      status: 502,
      error: "Couldn't verify server access with Discord. Try again shortly.",
    };
  }
}
