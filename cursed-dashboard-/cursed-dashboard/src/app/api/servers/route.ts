import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  DiscordAuthError,
  fetchUserGuilds,
  filterManageableGuilds,
  toManageableGuilds,
} from "@/lib/discord";

/**
 * GET /api/servers
 *
 * Returns the guilds the signed-in user has MANAGE_GUILD on. Used by the
 * server-selection page after login.
 *
 * Reads the Discord access token straight off the encrypted session JWT via
 * `getToken()` — this is server-only and never touches the client-visible
 * session object (see `src/lib/auth/config.ts`).
 */
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const allGuilds = await fetchUserGuilds(token.accessToken);
    const manageable = filterManageableGuilds(allGuilds);

    // NOTE: no DB writes yet per this step's spec. Once `src/lib/db` exists,
    // this is where we'd upsert the `users` collection's cached guild list
    // (docs/ARCHITECTURE.md → "users — cached Discord profile + which
    // guilds they manage, refreshed on login").
    return NextResponse.json({ guilds: toManageableGuilds(manageable) });
  } catch (err) {
    if (err instanceof DiscordAuthError) {
      return NextResponse.json(
        { error: "Discord session expired. Please sign in again." },
        { status: 401 }
      );
    }
    console.error("[GET /api/servers]", err);
    return NextResponse.json(
      { error: "Couldn't reach Discord. Try again in a moment." },
      { status: 502 }
    );
  }
}
