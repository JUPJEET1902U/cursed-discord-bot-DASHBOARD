import "server-only";
import type {
  DiscordChannel,
  DiscordGuildMember,
  DiscordPartialGuild,
  DiscordRole,
  ManageableGuild,
} from "@/types/discord";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/** Text-capable channel types the welcome-channel selector should offer. */
const TEXT_CHANNEL_TYPES = new Set([0, 5]); // GUILD_TEXT, GUILD_ANNOUNCEMENT

/** The MANAGE_GUILD permission bit (Discord permissions bitfield). */
const MANAGE_GUILD = BigInt(0x20);

/**
 * Returns true if the given guild's permission bitfield grants MANAGE_GUILD,
 * or if the user owns the guild outright (owners always implicitly have it).
 *
 * Discord permission bitfields can exceed Number.MAX_SAFE_INTEGER, so this
 * always compares as BigInt rather than doing bitwise math on `number`.
 */
export function canManageGuild(guild: DiscordPartialGuild): boolean {
  if (guild.owner) return true;
  try {
    const bits = BigInt(guild.permissions);
    return (bits & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    // Malformed/missing permissions field — fail closed.
    return false;
  }
}

/** Filters a guild list down to ones the user can manage. */
export function filterManageableGuilds(
  guilds: DiscordPartialGuild[]
): DiscordPartialGuild[] {
  return guilds.filter(canManageGuild);
}

/** Builds a CDN URL for a guild icon, or null if the guild has none. */
export function guildIconUrl(
  guildId: string,
  icon: string | null
): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=64`;
}

/**
 * Fetches the guilds the authenticated user belongs to, straight from
 * Discord (`GET /users/@me/guilds`), using their OAuth2 access token.
 *
 * Server-only: takes a raw access token, so this must never run in a Client
 * Component or be exposed to the browser.
 */
export async function fetchUserGuilds(
  accessToken: string
): Promise<DiscordPartialGuild[]> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Discord's own guild list changes rarely enough within a session that a
    // short cache avoids hammering their API on every dashboard navigation.
    next: { revalidate: 60 },
  });

  if (res.status === 401) {
    throw new DiscordAuthError("Discord access token expired or revoked.");
  }
  if (!res.ok) {
    throw new Error(`Discord API error fetching guilds: ${res.status}`);
  }

  return res.json();
}

export class DiscordAuthError extends Error {}

/**
 * PLACEHOLDER: cross-references the user's manageable guilds against the
 * set of guilds the bot is actually in.
 *
 * Once the bot-status/Mongo integration exists (docs/ARCHITECTURE.md —
 * `guildConfigs` is seeded per-guild by the bot on join), this should read
 * the bot's known guild IDs from MongoDB instead of guessing. For this step
 * we don't have DB writes yet, so every manageable guild is marked as
 * `botIsMember: false` — the server-selection UI treats that as "not set up
 * yet, click to invite" rather than failing outright.
 */
export function toManageableGuilds(
  guilds: DiscordPartialGuild[]
): ManageableGuild[] {
  return guilds.map((guild) => ({
    ...guild,
    botIsMember: false, // TODO: replace with real lookup once DB reads land
    iconUrl: guildIconUrl(guild.id, guild.icon),
  }));
}

/**
 * Read-only lookup of a guild's text-capable channels, used solely to
 * populate the welcome/goodbye channel selector and to validate that a
 * submitted channel ID actually belongs to the guild. This uses the bot's
 * own token (`DISCORD_BOT_TOKEN`), not the signed-in user's OAuth token —
 * listing channels isn't exposed by the `identify guilds` user scope this
 * app requests.
 *
 * This is intentionally the *only* Discord surface the welcome feature
 * touches. It never posts messages, never opens a gateway connection, and
 * never imports anything from the bot's codebase — it's a plain HTTPS GET
 * against Discord's REST API, same as any other Discord API consumer.
 *
 * Returns `null` (rather than throwing) if the bot token is missing, the
 * bot isn't in the guild, or the call otherwise fails — callers treat that
 * as "channel list unavailable" and fall back to manual channel-ID entry,
 * rather than blocking the whole page.
 */
export async function fetchGuildChannels(
  guildId: string
): Promise<DiscordChannel[] | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;

    const channels = (await res.json()) as DiscordChannel[];
    return channels
      .filter((c) => TEXT_CHANNEL_TYPES.has(c.type))
      .sort((a, b) => a.position - b.position);
  } catch {
    return null;
  }
}

/**
 * Read-only lookup of every role in a guild (including `@everyone`), used
 * to populate the autorole picker and to validate submitted role IDs
 * server-side. Same bot-token, GET-only pattern as `fetchGuildChannels` —
 * this never assigns a role to anyone, it only reads the guild's role list.
 * Returns `null` if the bot token is missing or the guild is unreachable.
 */
export async function fetchGuildRoles(
  guildId: string
): Promise<DiscordRole[] | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;

    const roles = (await res.json()) as DiscordRole[];
    return roles.sort((a, b) => b.position - a.position);
  } catch {
    return null;
  }
}

/**
 * Returns the position (hierarchy rank) of the bot's own highest role in a
 * guild, purely so the UI can *warn* — never block — when an admin selects
 * a role the bot wouldn't currently be able to assign. Reads the bot's own
 * member object (`GET /guilds/{id}/members/@me` works with a bot token,
 * no need to know the bot's user ID separately) and cross-references
 * against the already-fetched role list. Returns `null` if unavailable, in
 * which case the UI simply skips the hierarchy warning.
 */
export async function fetchBotHighestRolePosition(
  guildId: string,
  roles: DiscordRole[]
): Promise<number | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/@me`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return null;

    const member = (await res.json()) as DiscordGuildMember;
    const positions = roles
      .filter((r) => member.roles.includes(r.id))
      .map((r) => r.position);
    return positions.length > 0 ? Math.max(...positions) : 0;
  } catch {
    return null;
  }
}
