import { z } from "zod";

const snowflake = z.string().regex(/^\d{17,20}$/, "Enter a valid Discord ID.");
const nullableSnowflake = snowflake.nullable();

export const securityResponseActionSchema = z.enum(["alert", "quarantine", "lockdown", "neutralize"]);
export const trustedSubjectTypeSchema = z.enum(["user", "role", "bot", "channel"]);
export const trustedScopeSchema = z.enum([
  "automod",
  "antiRaid",
  "massModeration",
  "manageChannels",
  "manageRoles",
  "addBots",
  "manageWebhooks",
  "manualModeration",
]);

export const trustedEntrySchema = z.object({
  subjectType: trustedSubjectTypeSchema,
  subjectId: snowflake,
  scopes: z.array(trustedScopeSchema).max(8),
}).strict();

export const securityConfigSchema = z.object({
  enabled: z.boolean(),
  securityLogChannelId: nullableSnowflake,
  antiRaid: z.object({
    enabled: z.boolean(),
    joinThreshold: z.number().int().min(3).max(100),
    windowSeconds: z.number().int().min(5).max(300),
    minAccountAgeHours: z.number().int().min(0).max(8760),
    action: securityResponseActionSchema,
    activeRaidSeconds: z.number().int().min(30).max(1800),
  }).strict(),
  antiNuke: z.object({
    enabled: z.boolean(),
    action: securityResponseActionSchema,
    windowSeconds: z.number().int().min(5).max(300),
    restoreDeletedChannels: z.boolean(),
    restoreDeletedRoles: z.boolean(),
    removeDangerousRoles: z.boolean(),
    banMaliciousBots: z.boolean(),
    autoLockdown: z.boolean(),
    ownerAlerts: z.boolean(),
    neutralizeTimeoutMinutes: z.number().int().min(1).max(40320),
    thresholds: z.object({
      bans: z.number().int().min(1).max(50),
      kicks: z.number().int().min(1).max(50),
      channelDeletes: z.number().int().min(1).max(25),
      channelCreates: z.number().int().min(1).max(50),
      channelUpdates: z.number().int().min(1).max(50),
      roleDeletes: z.number().int().min(1).max(25),
      roleCreates: z.number().int().min(1).max(50),
      roleUpdates: z.number().int().min(1).max(50),
      webhookChanges: z.number().int().min(1).max(25),
      dangerousRoleChanges: z.number().int().min(1).max(25),
      botAdds: z.number().int().min(1).max(25),
      guildUpdates: z.number().int().min(1).max(25),
    }).strict(),
  }).strict(),
  messageShield: z.object({
    enabled: z.boolean(),
    windowSeconds: z.number().int().min(3).max(60),
    repeatedMessageThreshold: z.number().int().min(2).max(15),
    rapidMessageThreshold: z.number().int().min(3).max(30),
    botInviteThreshold: z.number().int().min(1).max(10),
    inviteThreshold: z.number().int().min(1).max(20),
    linkThreshold: z.number().int().min(1).max(30),
    maxMentions: z.number().int().min(2).max(50),
  }).strict(),
  quarantine: z.object({
    enabled: z.boolean(),
    roleId: nullableSnowflake,
    channelId: nullableSnowflake,
    removeManageableRoles: z.boolean(),
  }).strict(),
  lockdown: z.object({
    enabled: z.boolean(),
    channelIds: z.array(snowflake).max(200),
    raiseVerificationLevel: z.boolean(),
  }).strict(),
  trusted: z.object({
    enabled: z.boolean(),
    entries: z.array(trustedEntrySchema).max(200),
  }).strict(),
}).strict();

export const securityActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("lockdown-enable"), reason: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ action: z.literal("lockdown-disable"), reason: z.string().trim().max(1000).optional() }).strict(),
  z.object({ action: z.literal("quarantine"), userId: snowflake, reason: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ action: z.literal("unquarantine"), userId: snowflake, reason: z.string().trim().max(1000).optional() }).strict(),
]);

export const securityIncidentOperationSchema = z.object({
  action: z.enum(["resolve", "ignore", "reopen"]),
  note: z.string().trim().max(2000).nullable().optional(),
}).strict();
