"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchInternal } from "@/lib/api";
import { SELECTED_GUILD_COOKIE } from "@/lib/guild";
import type { ManageableGuild } from "@/types/discord";

/**
 * Sets the active guild for the dashboard session, after re-verifying
 * server-side that the user still actually manages it — never trusts the
 * guildId a form/client might send.
 */
export async function selectServer(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const guildId = formData.get("guildId");
  if (typeof guildId !== "string" || !guildId) {
    redirect("/dashboard?error=invalid_selection");
  }

  const res = await fetchInternal("/api/servers");
  if (!res.ok) {
    redirect("/dashboard?error=fetch_failed");
  }

  const { guilds } = (await res.json()) as { guilds: ManageableGuild[] };
  const isManageable = guilds.some((g) => g.id === guildId);

  if (!isManageable) {
    // Either a tampered request, or the user's permissions changed between
    // page load and click. Either way, don't set the cookie.
    redirect("/dashboard?error=access_denied");
  }

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_GUILD_COOKIE, guildId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(`/dashboard?selected=${guildId}`);
}

/** Clears the active guild, e.g. from a "switch server" control. */
export async function clearSelectedServer() {
  const cookieStore = await cookies();
  cookieStore.delete(SELECTED_GUILD_COOKIE);
  redirect("/dashboard");
}
