import "server-only";
import type { DiscordPartialGuild, ManageableGuild } from "@/types/discord";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const MANAGE_GUILD = BigInt(0x20);

export function canManageGuild(guild: DiscordPartialGuild): boolean {
  if (guild.owner) return true;
  try {
    const bits = BigInt(guild.permissions);
    return (bits & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

export function filterManageableGuilds(
  guilds: DiscordPartialGuild[]
): DiscordPartialGuild[] {
  return guilds.filter(canManageGuild);
}

export function guildIconUrl(
  guildId: string,
  icon: string | null
): string | null {
  if (!icon) return null;
  const extension = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}?size=64`;
}

export async function fetchUserGuilds(
  accessToken: string
): Promise<DiscordPartialGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 60 },
  });

  if (response.status === 401) {
    throw new DiscordAuthError("Discord access token expired or revoked.");
  }
  if (!response.ok) {
    throw new Error(`Discord API error fetching guilds: ${response.status}`);
  }
  return response.json();
}

export class DiscordAuthError extends Error {}

export function toManageableGuilds(
  guilds: DiscordPartialGuild[],
  botGuildIds: Set<string> | null
): ManageableGuild[] {
  return guilds.map((guild) => ({
    ...guild,
    botIsMember: botGuildIds ? botGuildIds.has(guild.id) : null,
    iconUrl: guildIconUrl(guild.id, guild.icon),
  }));
}
