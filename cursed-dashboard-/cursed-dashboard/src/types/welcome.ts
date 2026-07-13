/**
 * Exact welcome fields read by the live bot's `utils/welcome.js` and
 * `utils/serverConfig.js`.
 *
 * The dashboard API writes these same top-level fields into the `guildConfigs`
 * MongoDB collection read by the bot's GuildConfigStore.
 *
 * Enabled state is intentionally not stored as `enabled`: in the bot, welcome
 * is enabled when `welcomeChannelId` is set and disabled when it is `null`.
 */
export interface WelcomeConfig {
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeUseAI: boolean;
  welcomeColor: string | null;
  welcomeThumbnail: boolean;
  welcomeImageUrl: string | null;
  welcomeFooter: string | null;
}

export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  welcomeChannelId: null,
  welcomeMessage: null,
  welcomeUseAI: false,
  welcomeColor: null,
  welcomeThumbnail: true,
  welcomeImageUrl: null,
  welcomeFooter: null,
};

export const BOT_DEFAULT_WELCOME_MESSAGE =
  "**Welcome to {server}, {user}!** We're glad you're here.";
