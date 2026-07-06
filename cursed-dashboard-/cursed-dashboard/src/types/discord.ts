/**
 * Partial Discord API types — only the fields this dashboard actually
 * consumes. Mirrors the shape of Discord's REST responses, not our own
 * MongoDB documents (those live in `src/types/` once the DB-write step
 * builds them out, per docs/ARCHITECTURE.md).
 */

/** Shape returned by `GET /users/@me/guilds`. */
export interface DiscordPartialGuild {
  id: string;
  name: string;
  icon: string | null;
  /** True if the current user owns this guild outright. */
  owner: boolean;
  /** Bitfield of the user's permissions in this guild, as a base-10 string. */
  permissions: string;
  features: string[];
}

/** A guild the user can manage, enriched with whether the bot is present. */
export interface ManageableGuild extends DiscordPartialGuild {
  /** Populated by /api/servers once it cross-references the bot's guild list. */
  botIsMember: boolean;
  iconUrl: string | null;
}

/** Shape returned by `GET /users/@me`. */
export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

/**
 * Minimal shape from `GET /guilds/{id}/channels`, trimmed to what the
 * dashboard needs to render a channel selector. Discord channel `type`
 * values used here: 0 = text, 5 = announcement.
 */
export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  position: number;
}

/**
 * Minimal shape from `GET /guilds/{id}/roles`. `position` is the role's
 * rank in the hierarchy (higher number = higher rank); `@everyone` always
 * has `id === guildId` and `position === 0`. `managed` roles are owned by
 * an integration (a bot's own role, a booster role, etc.) and can't be
 * manually assigned.
 */
export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  permissions: string;
}

/** Minimal shape from `GET /guilds/{id}/members/{userId}`, used only to
 * read the bot's own role list so the dashboard can warn about hierarchy
 * conflicts. */
export interface DiscordGuildMember {
  roles: string[];
}
