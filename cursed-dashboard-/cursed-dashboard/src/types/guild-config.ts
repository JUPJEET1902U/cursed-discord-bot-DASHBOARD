import type { WelcomeConfig } from "@/types/welcome";
import type { AutoroleConfig } from "@/types/autorole";
import type { AISettingsConfig } from "@/types/ai-settings";
import type { LogsConfig } from "@/types/logs";
import type { GuildSettings } from "@/types/guild-settings";

/**
 * One document per guild in the `guildConfigs` collection (see
 * `docs/ARCHITECTURE.md` → "MongoDB collections (contract with the bot)").
 * Every feature's settings (welcome, autorole, goodbye, ...) live as
 * sub-fields on this same shared document, keyed by `guildId`, so the bot
 * can load a guild's entire config in one read. Add new features here as
 * additional optional sub-fields rather than creating new collections.
 */
export interface GuildConfigDocument {
  guildId: string;
  updatedAt?: Date;

  welcomeChannelId?: string | null;
  welcomeMessage?: string | null;
  welcomeUseAI?: boolean;
  welcomeColor?: string | null;
  welcomeThumbnail?: boolean;
  welcomeImageUrl?: string | null;
  welcomeFooter?: string | null;

  /** Legacy dashboard-only nested draft. New Welcome saves remove this. */
  welcome?: WelcomeConfig;
  welcomeUpdatedBy?: string;

  autorole?: AutoroleConfig;
  autoroleUpdatedBy?: string;

  aiSettings?: AISettingsConfig;
  aiSettingsUpdatedBy?: string;

  logs?: LogsConfig;
  logsUpdatedBy?: string;

  settings?: GuildSettings;
  settingsUpdatedBy?: string;
}
