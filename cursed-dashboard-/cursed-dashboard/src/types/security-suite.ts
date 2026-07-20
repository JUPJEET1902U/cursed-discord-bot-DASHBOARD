import type { SecurityResponseAction } from "@/types/security";

export interface SecuritySuiteConfig {
  antiRaidAdvanced: {
    requireAvatar: boolean;
    suspiciousNameCheck: boolean;
    riskScoreThreshold: number;
  };
  backup: {
    enabled: boolean;
    intervalHours: number;
    retentionCount: number;
    restoreServerSettings: boolean;
  };
  tamperProtection: {
    enabled: boolean;
    ownerOnlyDisable: boolean;
    protectBotRole: boolean;
    protectQuarantineRole: boolean;
    autoIncidentMode: boolean;
  };
  botApprovals: {
    enabled: boolean;
    defaultExpiryMinutes: number;
    oneTime: boolean;
  };
  incidentMode: {
    enabled: boolean;
    durationMinutes: number;
    autoLockdown: boolean;
    strictMessageShield: boolean;
    blockUnapprovedBots: boolean;
  };
  staffLimits: {
    enabled: boolean;
    windowSeconds: number;
    action: SecurityResponseAction;
    thresholds: {
      bans: number;
      kicks: number;
      channelChanges: number;
      roleChanges: number;
      webhookChanges: number;
    };
  };
  reports: {
    enabled: boolean;
    maxTimelineEvents: number;
    includeAuditDetails: boolean;
  };
}

export interface SecuritySnapshotSummary {
  id: string;
  name: string;
  reason: string;
  status: "ready" | "restored" | "failed";
  roleCount: number;
  channelCount: number;
  createdById: string | null;
  createdAt: string | null;
  restoredAt: string | null;
}

export interface SecurityBotApproval {
  id: string;
  botId: string;
  approvedById: string;
  note: string | null;
  active: boolean;
  expiresAt: string;
  createdAt: string | null;
  usedAt: string | null;
  usedByInviterId: string | null;
}

export interface SecurityIncidentModeState {
  available: boolean;
  active: boolean;
  reason: string | null;
  activatedById: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  lockdownStartedByMode: boolean;
}

export interface SecurityHealthResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  issues: string[];
  recommendations: string[];
  permissions: Array<{ name: string; ready: boolean }>;
  dangerousRolesAboveBot: Array<{ id: string; name: string; position: number }>;
  administratorBots: Array<{ id: string; tag: string }>;
  checkedAt: string;
}

export interface SecuritySuiteData {
  config: SecuritySuiteConfig;
  snapshots: SecuritySnapshotSummary[];
  approvals: SecurityBotApproval[];
  incidentMode: SecurityIncidentModeState;
  health: SecurityHealthResult;
}

export type SecuritySuiteActionRequest =
  | { action: "backup-create"; reason?: string }
  | { action: "backup-restore"; snapshotId: string; reason: string }
  | { action: "approval-add"; botId: string; expiresMinutes?: number; note?: string }
  | { action: "approval-revoke"; approvalId: string }
  | { action: "incident-enable"; reason: string; durationMinutes?: number }
  | { action: "incident-disable"; reason?: string }
  | { action: "security-audit" }
  | { action: "incident-report"; incidentId?: string };

export interface SecuritySuiteActionResult {
  result: {
    ok: boolean;
    error?: string;
    html?: string;
    report?: {
      guildId: string;
      generatedAt: string;
      focusIncidentId: string | null;
      incidentCount: number;
      incidents: Array<Record<string, unknown>>;
    };
    health?: SecurityHealthResult;
    [key: string]: unknown;
  };
  data: SecuritySuiteData;
}