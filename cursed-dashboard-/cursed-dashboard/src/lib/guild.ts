import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchInternal } from "@/lib/api";
import type { ManageableGuild } from "@/types/discord";

export const SELECTED_GUILD_COOKIE = "cursed_selected_guild";

/**
 * Reads the selected-guild cookie and re-verifies it against the user's current
 * manageable guild list. React cache keeps that verification to one request per
 * server render even when both the guild layout and page need the same guild.
 */
async function readSelectedGuild(): Promise<ManageableGuild | null> {
  const cookieStore = await cookies();
  const guildId = cookieStore.get(SELECTED_GUILD_COOKIE)?.value;
  if (!guildId) return null;

  const res = await fetchInternal("/api/servers");
  if (!res.ok) return null;

  const { guilds } = (await res.json()) as { guilds: ManageableGuild[] };
  return guilds.find((guild) => guild.id === guildId) ?? null;
}

export const getSelectedGuild = cache(readSelectedGuild);

/**
 * Guard for every guild-scoped page (Overview, Welcome, Moderation, etc).
 * Redirects to server selection when the chosen guild is no longer manageable.
 */
export async function requireSelectedGuild(): Promise<ManageableGuild> {
  const guild = await getSelectedGuild();
  if (!guild) {
    redirect("/dashboard");
  }
  return guild;
}
