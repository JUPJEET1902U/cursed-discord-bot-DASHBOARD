export type WarningEscalationAction = "timeout" | "kick" | "ban";

export interface WarningThreshold {
  warnings: number;
  action: WarningEscalationAction;
  durationMinutes: number | null;
}

export interface ModerationConfig {
  moderationCommandsEnabled: boolean;
  moderatorRoleIds: string[];
  modLogChannelId: string | null;
  defaultTimeoutMinutes: number;
  dmPunishedUsers: boolean;
  requireModerationReason: boolean;
  warningEscalationEnabled: boolean;
  warningThresholds: WarningThreshold[];
  antiSpam: boolean;
  antiLink: boolean;
  antiInvite: boolean;
  linkWhitelist: string[];
}

export interface ModerationChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  canView: boolean;
  canSend: boolean;
  canEmbed: boolean;
}

export interface ModerationRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface ModerationBotPermissions {
  moderateMembers: boolean;
  kickMembers: boolean;
  banMembers: boolean;
  manageMessages: boolean;
  manageChannels: boolean;
  viewAuditLog: boolean;
  logChannelReady: boolean;
  botHighestRolePosition: number;
}

export interface ModerationCase {
  id: string | null;
  guildId: string;
  caseNumber: number;
  action: string;
  targetId: string;
  targetTag: string;
  moderatorId: string | null;
  moderatorTag: string;
  reason: string;
  durationMs: number | null;
  evidenceUrl: string | null;
  source: "manual" | "automod" | "system" | "migration";
  status: "active" | "revoked" | "expired";
  expiresAt: string | null;
  revokedAt: string | null;
  revokedById: string | null;
  revokedByTag: string | null;
  revokeReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ModerationStats {
  available: boolean;
  total: number;
  active: number;
  warnings: number;
  automod: number;
  last24Hours: number;
}

export interface ModerationData {
  config: ModerationConfig;
  channels: ModerationChannel[];
  roles: ModerationRole[];
  botPermissions: ModerationBotPermissions;
  stats: ModerationStats;
  cases: ModerationCase[];
  mongoConnected: boolean;
}

export type ModerationCaseOperation =
  | { operation: "reason"; reason: string }
  | { operation: "revoke"; reason?: string | null }
  | { operation: "delete" };
