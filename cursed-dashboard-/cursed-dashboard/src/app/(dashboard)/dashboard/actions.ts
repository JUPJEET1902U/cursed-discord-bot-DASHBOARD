"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchInternal } from "@/lib/api";
import { SELECTED_GUILD_COOKIE } from "@/lib/guild";
import type { ManageableGuild } from "@/types/discord";

export async function selectServer(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const guildId = formData.get("guildId");
  if (typeof guildId !== "string" || !guildId) {
    redirect("/dashboard?error=invalid_selection");
  }

  const response = await fetchInternal("/api/servers");
  if (!response.ok) redirect("/dashboard?error=fetch_failed");

  const { guilds } = (await response.json()) as { guilds: ManageableGuild[] };
  const guild = guilds.find((item) => item.id === guildId);
  if (!guild) redirect("/dashboard?error=access_denied");
  if (guild.botIsMember === false) redirect("/dashboard?error=bot_not_added");
  if (guild.botIsMember === null) redirect("/dashboard?error=bot_unavailable");

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_GUILD_COOKIE, guildId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard/overview");
}

export async function clearSelectedServer() {
  const cookieStore = await cookies();
  cookieStore.delete(SELECTED_GUILD_COOKIE);
  redirect("/dashboard");
}
