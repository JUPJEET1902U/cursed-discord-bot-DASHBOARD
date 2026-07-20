export type SecurityResponseAction = "alert" | "quarantine" | "lockdown" | "neutralize";
export type TrustedSubjectType = "user" | "role" | "bot" | "channel";
export type TrustedScope =
  | "automod"
  | "antiRaid"
  | "massModeration"
  | "manageChannels"
  | "manageRoles"
  | "addBots"
  | "manageWebhooks"
  | "manualModeration";

export interface TrustedEntry {
  subjectType: TrustedSubjectType;
  subjectId: string;
  scopes: TrustedScope[];
}

export interface SecurityConfig {
  enabled: boolean;
  securityLogChannelId: string | null;
  antiRaid: {
    enabled: boolean;
    joinThreshold: number;
    windowSeconds: number;
    minAccountAgeHours: number;
    action: SecurityResponseAction;
    activeRaidSeconds: number;
  };
  antiNuke: {
    enabled: boolean;
    action: SecurityResponseAction;
    windowSeconds: number;
    restoreDeletedChannels: boolean;
    restoreDeletedRoles: boolean;
    removeDangerousRoles: boolean;
    banMaliciousBots: boolean;
    autoLockdown: boolean;
    ownerAlerts: boolean;
    neutralizeTimeoutMinutes: number;
    thresholds: {
      bans: number;
      kicks: number;
      channelDeletes: number;
      channelCreates: number;
      channelUpdates: number;
      roleDeletes: number;
      roleCreates: number;
      roleUpdates: number;
      webhookChanges: number;
      dangerousRoleChanges: number;
      botAdds: number;
      guildUpdates: number;
    };
  };
  messageShield: {
    enabled: boolean;
    windowSeconds: number;
    repeatedMessageThreshold: number;
    rapidMessageThreshold: number;
    botInviteThreshold: number;
    inviteThreshold: number;
    linkThreshold: number;
    maxMentions: number;
  };
  quarantine: {
    enabled: boolean;
    roleId: string | null;
    channelId: string | null;
    removeManageableRoles: boolean;
  };
  lockdown: {
    enabled: boolean;
    channelIds: string[];
    raiseVerificationLevel: boolean;
  };
  trusted: {
    enabled: boolean;
    entries: TrustedEntry[];
  };
}

export interface SecurityChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  canView: boolean;
  canSend: boolean;
  canManageChannel: boolean;
}

export interface SecurityRole {
  id: string;
  name: string;
  color: number;
  position: number;
  editable: boolean;
}

export interface SecurityBotPermissions {
  manageChannels: boolean;
  manageRoles: boolean;
  manageWebhooks: boolean;
  manageMessages: boolean;
  viewAuditLog: boolean;
  moderateMembers: boolean;
  kickMembers: boolean;
  banMembers: boolean;
  botHighestRolePosition: number;
}

export interface SecurityIncidentStats {
  available: boolean;
  total: number;
  open: number;
  critical: number;
  last24Hours: number;
}

export interface SecurityIncident {
  id: string | null;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  executorId: string | null;
  executorTag: string;
  targetId: string | null;
  targetTag: string | null;
  actionTaken: string;
  status: "open" | "resolved" | "ignored";
  details: Record<string, unknown>;
  createdAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface SecurityLockdownStatus {
  available: boolean;
  active: boolean;
  status: string;
  channelCount: number;
  activatedAt: string | null;
  missingChannelIds: string[];
}

export interface ActiveQuarantine {
  userId: string;
  userTag: string;
  roleId: string;
  reason: string;
  updatedAt: string | null;
}

export interface SecurityData {
  config: SecurityConfig;
  channels: SecurityChannel[];
  roles: SecurityRole[];
  botPermissions: SecurityBotPermissions;
  stats: SecurityIncidentStats;
  incidents: SecurityIncident[];
  lockdown: SecurityLockdownStatus;
  quarantineCount: number;
  quarantines: ActiveQuarantine[];
  mongoConnected: boolean;
  trustedScopes: TrustedScope[];
}

export type SecurityActionRequest =
  | { action: "lockdown-enable"; reason: string }
  | { action: "lockdown-disable"; reason?: string }
  | { action: "quarantine"; userId: string; reason: string }
  | { action: "unquarantine"; userId: string; reason?: string };

export type SecurityIncidentOperation = {
  action: "resolve" | "ignore" | "reopen";
  note?: string | null;
};
