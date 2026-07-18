export interface AdvancedCommandToggles {
  purge: boolean;
  lock: boolean;
  unlock: boolean;
  slowmode: boolean;
  nickname: boolean;
  tempban: boolean;
  softban: boolean;
  note: boolean;
  history: boolean;
}

export interface AdvancedModerationLogging {
  messageDeleteEnabled: boolean;
  messageEditEnabled: boolean;
  memberUpdateEnabled: boolean;
  storeDeletedMessageContent: boolean;
  messageLogChannelId: string | null;
  memberLogChannelId: string | null;
}

export interface ModerationWhitelist {
  enabled: boolean;
  userIds: string[];
  roleIds: string[];
  channelIds: string[];
  botIds: string[];
  exemptFromAutomod: boolean;
  protectFromManualModeration: boolean;
}

export interface AdvancedModerationConfig {
  advancedModerationEnabled: boolean;
  maxPurgeAmount: number;
  tempBansEnabled: boolean;
  softbansEnabled: boolean;
  moderatorNotesEnabled: boolean;
  dangerousCommandsAdminOnly: boolean;
  commandToggles: AdvancedCommandToggles;
  logging: AdvancedModerationLogging;
  whitelist: ModerationWhitelist;
}

export interface AdvancedModerationChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  canView: boolean;
  canSend: boolean;
  canManageMessages: boolean;
  canManageChannel: boolean;
}

export interface AdvancedModerationRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface AdvancedBotPermissions {
  manageMessages: boolean;
  manageChannels: boolean;
  manageNicknames: boolean;
  banMembers: boolean;
  moderateMembers: boolean;
}

export interface PendingModerationTasks {
  available: boolean;
  total: number;
  tempbans: number;
  failed: number;
}

export interface AdvancedCaseStats {
  available: boolean;
  total: number;
  active: number;
  warnings: number;
  automod: number;
  last24Hours: number;
}

export interface AdvancedModerationData {
  config: AdvancedModerationConfig;
  channels: AdvancedModerationChannel[];
  roles: AdvancedModerationRole[];
  botPermissions: AdvancedBotPermissions;
  pendingTasks: PendingModerationTasks;
  lockedChannelIds: string[];
  caseStats: AdvancedCaseStats;
  mongoConnected: boolean;
}

export type AdvancedCaseOperation =
  | { operation: "note"; note: string }
  | { operation: "evidence"; evidenceUrl: string | null };
