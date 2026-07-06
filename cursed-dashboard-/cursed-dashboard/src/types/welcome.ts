/**
 * Shapes for the `welcome` sub-document inside `guildConfigs` (see
 * `docs/ARCHITECTURE.md` → "MongoDB collections (contract with the bot)").
 *
 * These are pure configuration — no message is ever sent from this repo.
 * The bot reads this exact shape from MongoDB on its own schedule and does
 * the actual sending. Field names/types here are the contract; coordinate
 * with the bot codebase before renaming anything.
 *
 * Supported template variables (documented for the UI, substituted by the
 * bot — this dashboard never resolves them):
 *   {user}         → the new member's display name
 *   {mention}      → an @mention of the new member
 *   {server}       → the guild's name
 *   {membercount}  → the guild's member count after the join
 */

export interface WelcomeEmbedConfig {
  enabled: boolean;
  title: string;
  description: string;
  /** Hex color, e.g. "#7C3AED". */
  color: string;
  thumbnail: boolean;
  footer: string;
  /** Empty string means "no image". */
  imageUrl: string;
}

export interface WelcomeConfig {
  enabled: boolean;
  /** Discord channel snowflake, or null if never configured. */
  channelId: string | null;
  message: string;
  mentionUser: boolean;
  embed: WelcomeEmbedConfig;
}

export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  enabled: false,
  channelId: null,
  message: "Welcome {mention} to **{server}**! Glad to have you here.",
  mentionUser: true,
  embed: {
    enabled: true,
    title: "Welcome to {server}! 👋",
    description:
      "Hey {user}, we're glad you're here.\nYou're member **#{membercount}**.",
    color: "#7C3AED",
    thumbnail: true,
    footer: "Joined {server}",
    imageUrl: "",
  },
};
