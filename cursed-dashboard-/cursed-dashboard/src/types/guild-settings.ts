import type { AIProvider } from "@/types/ai-settings";

/**
 * Shape for the `settings` sub-document inside `guildConfigs` (same
 * collection/contract as `welcome`/`autorole`/`aiSettings`/`logs` — see
 * `docs/ARCHITECTURE.md`). Holds server-wide defaults and dashboard-only
 * cosmetic fields rather than any single feature's own config.
 *
 * Pure configuration — this dashboard never renames the actual Discord
 * server, never calls an AI provider, and never times out or warns a
 * member. The bot reads this exact shape from MongoDB on its own schedule
 * and applies these as its defaults/fallbacks.
 */

/** Only "en" exists today; declared as a const tuple (not a bare `string[]`)
 * so its literal member type flows through to `SupportedLanguage` and to
 * `z.enum(SUPPORTED_LANGUAGES)` in validation — adding a language later is
 * still a one-line change everywhere it's used. */
export const SUPPORTED_LANGUAGES = ["en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface FeatureToggles {
  welcomeMessages: boolean;
  autorole: boolean;
  aiChat: boolean;
  moderation: boolean;
  logging: boolean;
}

export interface GeneralSettings {
  /** Cosmetic label shown in this dashboard only — never sent to Discord's
   * guild-rename endpoint, so it can safely differ from the real server name. */
  displayName: string;
  /** Hex color used for this guild's accent in the dashboard UI itself. */
  accentColor: string;
  /** Hex color the bot falls back to for embeds that don't set their own. */
  embedColor: string;
  /** IANA timezone identifier, e.g. "America/New_York". */
  timezone: string;
  language: SupportedLanguage;
  /**
   * Per-module master switches. These are a convenience kill-switch layered
   * on top of each feature's own `enabled` flag (`welcome.enabled`,
   * `autorole.enabled`, ...) — the bot should treat a feature as active only
   * when BOTH its own config is enabled AND the matching toggle here is on.
   * This lets an admin instantly mute a whole module from one place without
   * losing that module's saved configuration.
   */
  featureToggles: FeatureToggles;
}

export interface AIDefaultsSettings {
  /** Whether AI chat is enabled by default for this guild. */
  enabled: boolean;
  personality: string;
  /** Whether the bot retains long-term conversation memory by default. */
  memory: boolean;
  /** true → the bot only responds to AI chat when directly @mentioned. */
  mentionOnly: boolean;
  /** Minimum seconds between AI replies to the same user. */
  cooldown: number;
  /** Reserved for future multi-provider routing — not used yet. */
  providerPreference: AIProvider;
}

export interface ModerationDefaultsSettings {
  enabled: boolean;
  timeoutMinutes: number;
  warningThreshold: number;
}

export interface GuildSettings {
  general: GeneralSettings;
  aiDefaults: AIDefaultsSettings;
  moderationDefaults: ModerationDefaultsSettings;
}

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  welcomeMessages: true,
  autorole: true,
  aiChat: true,
  moderation: true,
  logging: true,
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  displayName: "",
  accentColor: "#8B5CF6",
  embedColor: "#8B5CF6",
  timezone: "UTC",
  language: "en",
  featureToggles: DEFAULT_FEATURE_TOGGLES,
};

export const DEFAULT_AI_DEFAULTS_SETTINGS: AIDefaultsSettings = {
  enabled: false,
  personality:
    "Friendly, a little playful, and helpful — keep replies concise.",
  memory: false,
  mentionOnly: false,
  cooldown: 5,
  providerPreference: "auto",
};

export const DEFAULT_MODERATION_DEFAULTS_SETTINGS: ModerationDefaultsSettings =
  {
    enabled: false,
    timeoutMinutes: 10,
    warningThreshold: 3,
  };

export const DEFAULT_GUILD_SETTINGS: GuildSettings = {
  general: DEFAULT_GENERAL_SETTINGS,
  aiDefaults: DEFAULT_AI_DEFAULTS_SETTINGS,
  moderationDefaults: DEFAULT_MODERATION_DEFAULTS_SETTINGS,
};
