export interface ControlCenterConfig {
  channelRestrictionEnabled: boolean;
  allowedChannels: string[];
  aiEnabled: boolean;
  aiMaxTokens: number;
  aiRateLimit: number;
  aiRateWindowSeconds: number;
  aiMemoryEnabled: boolean;
  aiLongTermMemoryEnabled: boolean;
  aiCustomPrompt: string | null;
  legacyEconomyXpEnabled: boolean;
  moderationCommandsEnabled: boolean;
  disabledModules: string[];
  disabledCommands: string[];
  antiSpam: boolean;
  antiLink: boolean;
  antiInvite: boolean;
  linkWhitelist: string[];
  modLogChannelId: string | null;
  premiumRoleId: string | null;
  paymentLinks: {
    kofi?: string | null;
    patreon?: string | null;
    bmc?: string | null;
  };
}

export interface DashboardLevelingConfig {
  enabled: boolean;
  levelUpChannelId: string | null;
  ignoredChannelIds: string[];
  xpMin: number;
  xpMax: number;
  cooldownSeconds: number;
  announceLevelUps: boolean;
  trackingStartedAt: string | null;
}

export interface LevelingStats {
  available: boolean;
  members: number;
  totalXp: number;
  totalMessages: number;
}

export interface ControlChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  canSend: boolean;
}

export interface ControlRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  assignable: boolean;
}

export interface ControlModule {
  key: string;
  label: string;
  description: string;
}

export interface ControlCommand {
  name: string;
  aliases: string[];
  label: string;
  description: string;
  category: string;
  categoryKey: string;
  protected: boolean;
}

export interface ControlCenterData {
  config: ControlCenterConfig;
  leveling: DashboardLevelingConfig;
  levelingStats: LevelingStats;
  channels: ControlChannel[];
  roles: ControlRole[];
  modules: ControlModule[];
  commands: ControlCommand[];
  aiProviders: {
    gemini: boolean;
    groq: boolean;
    openRouter: boolean;
  };
}

export interface ControlCenterSavePayload {
  config: ControlCenterConfig;
  leveling: Omit<DashboardLevelingConfig, "trackingStartedAt">;
}
