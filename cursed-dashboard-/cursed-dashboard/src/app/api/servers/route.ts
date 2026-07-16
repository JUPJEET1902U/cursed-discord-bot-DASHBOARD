import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getBotGuildPresence } from "@/lib/bot-api";
import {
  DiscordAuthError,
  fetchUserGuilds,
  filterManageableGuilds,
  toManageableGuilds,
} from "@/lib/discord";

/** Returns manageable Discord guilds enriched with live bot membership. */
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
    let botGuildIds: Set<string> | null = null;

    try {
      botGuildIds = await getBotGuildPresence(
        manageable.map((guild) => guild.id)
      );
    } catch (error) {
      console.warn("[GET /api/servers] bot presence unavailable", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return NextResponse.json({
      guilds: toManageableGuilds(manageable, botGuildIds),
      botStatusAvailable: botGuildIds !== null,
    });
  } catch (error) {
    if (error instanceof DiscordAuthError) {
      return NextResponse.json(
        { error: "Discord session expired. Please sign in again." },
        { status: 401 }
      );
    }
    console.error("[GET /api/servers]", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Couldn't reach Discord. Try again in a moment." },
      { status: 502 }
    );
  }
}
