import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireServerEnv } from "@/lib/env";

interface InvitePageProps {
  searchParams: Promise<{ guildId?: string }>;
}

const BOT_PERMISSIONS = "1099783597126";

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { guildId } = await searchParams;
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", requireServerEnv("DISCORD_CLIENT_ID"));
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", BOT_PERMISSIONS);
  if (/^\d{17,20}$/.test(guildId ?? "")) {
    url.searchParams.set("guild_id", guildId as string);
    url.searchParams.set("disable_guild_select", "true");
  }
  redirect(url.toString() as Route);
}
