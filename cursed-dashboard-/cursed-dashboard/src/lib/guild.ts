import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchInternal } from "@/lib/api";
import type { ManageableGuild } from "@/types/discord";

export const SELECTED_GUILD_COOKIE = "cursed_selected_guild";

/**
 * Reads the selected-guild cookie and re-verifies it against a fresh
 * server-side fetch of the user's manageable guilds — the cookie only ever
 * says "this is the guild ID we last confirmed"; it is never trusted as
 * proof of access on its own. Returns null if there's no selection, the
 * fetch fails, or the guild no longer appears in the user's manageable
 * list (kicked, lost Manage Server, etc.).
 */
export async function getSelectedGuild(): Promise<ManageableGuild | null> {
  const cookieStore = await cookies();
  const guildId = cookieStore.get(SELECTED_GUILD_COOKIE)?.value;
  if (!guildId) return null;

  const res = await fetchInternal("/api/servers");
  if (!res.ok) return null;

  const { guilds } = (await res.json()) as { guilds: ManageableGuild[] };
  return guilds.find((g) => g.id === guildId) ?? null;
}

/**
 * Guard for every guild-scoped page (Overview, Welcome, Moderation, etc).
 * Redirects to the server-selection page if there's no verified guild —
 * that page already owns the richer "you lost access" messaging, so this
 * stays a single, boring redirect rather than duplicating that logic.
 */
export async function requireSelectedGuild(): Promise<ManageableGuild> {
  const guild = await getSelectedGuild();
  if (!guild) {
    redirect("/dashboard");
  }
  return guild;
}
