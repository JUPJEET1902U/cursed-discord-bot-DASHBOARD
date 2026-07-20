import { z } from "zod";
import { securityResponseActionSchema } from "@/lib/validation/security";

const snowflake = z.string().regex(/^\d{17,20}$/, "Enter a valid Discord ID.");
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Enter a valid record ID.");

export const securitySuiteConfigSchema = z.object({
  antiRaidAdvanced: z.object({
    requireAvatar: z.boolean(),
    suspiciousNameCheck: z.boolean(),
    riskScoreThreshold: z.number().int().min(1).max(10),
  }).strict(),
  backup: z.object({
    enabled: z.boolean(),
    intervalHours: z.number().int().min(1).max(168),
    retentionCount: z.number().int().min(1).max(30),
    restoreServerSettings: z.boolean(),
  }).strict(),
  tamperProtection: z.object({
    enabled: z.boolean(),
    ownerOnlyDisable: z.boolean(),
    protectBotRole: z.boolean(),
    protectQuarantineRole: z.boolean(),
    autoIncidentMode: z.boolean(),
  }).strict(),
  botApprovals: z.object({
    enabled: z.boolean(),
    defaultExpiryMinutes: z.number().int().min(1).max(1440),
    oneTime: z.boolean(),
  }).strict(),
  incidentMode: z.object({
    enabled: z.boolean(),
    durationMinutes: z.number().int().min(5).max(1440),
    autoLockdown: z.boolean(),
    strictMessageShield: z.boolean(),
    blockUnapprovedBots: z.boolean(),
  }).strict(),
  staffLimits: z.object({
    enabled: z.boolean(),
    windowSeconds: z.number().int().min(10).max(300),
    action: securityResponseActionSchema,
    thresholds: z.object({
      bans: z.number().int().min(1).max(50),
      kicks: z.number().int().min(1).max(50),
      channelChanges: z.number().int().min(1).max(100),
      roleChanges: z.number().int().min(1).max(100),
      webhookChanges: z.number().int().min(1).max(50),
    }).strict(),
  }).strict(),
  reports: z.object({
    enabled: z.boolean(),
    maxTimelineEvents: z.number().int().min(10).max(200),
    includeAuditDetails: z.boolean(),
  }).strict(),
}).strict();

export const securitySuiteActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("backup-create"), reason: z.string().trim().max(500).optional() }).strict(),
  z.object({ action: z.literal("backup-restore"), snapshotId: objectId, reason: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ action: z.literal("approval-add"), botId: snowflake, expiresMinutes: z.number().int().min(1).max(1440).optional(), note: z.string().trim().max(500).optional() }).strict(),
  z.object({ action: z.literal("approval-revoke"), approvalId: objectId }).strict(),
  z.object({ action: z.literal("incident-enable"), reason: z.string().trim().min(1).max(1000), durationMinutes: z.number().int().min(5).max(1440).optional() }).strict(),
  z.object({ action: z.literal("incident-disable"), reason: z.string().trim().max(1000).optional() }).strict(),
  z.object({ action: z.literal("security-audit") }).strict(),
  z.object({ action: z.literal("incident-report"), incidentId: objectId.optional() }).strict(),
]);