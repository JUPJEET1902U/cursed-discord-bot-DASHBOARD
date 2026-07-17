import { z } from "zod";

const nullableUrl = z
  .union([z.string().url().max(2048), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : null));

export const controlCenterConfigSchema = z.object({
  channelRestrictionEnabled: z.boolean(),
  allowedChannels: z.array(z.string().regex(/^\d{17,20}$/)).max(250),
  aiEnabled: z.boolean(),
  aiMaxTokens: z.number().int().min(100).max(1500),
  aiRateLimit: z.number().int().min(1).max(30),
  aiRateWindowSeconds: z.number().int().min(10).max(600),
  aiMemoryEnabled: z.boolean(),
  aiLongTermMemoryEnabled: z.boolean(),
  aiCustomPrompt: z.string().max(2000).nullable(),
  legacyEconomyXpEnabled: z.boolean(),
  moderationCommandsEnabled: z.boolean(),
  disabledModules: z.array(z.string().min(1).max(100)).max(100),
  disabledCommands: z.array(z.string().min(2).max(100)).max(250),
  antiSpam: z.boolean(),
  antiLink: z.boolean(),
  antiInvite: z.boolean(),
  linkWhitelist: z.array(z.string().min(1).max(253)).max(100),
  modLogChannelId: z.string().regex(/^\d{17,20}$/).nullable(),
  premiumRoleId: z.string().regex(/^\d{17,20}$/).nullable(),
  paymentLinks: z.object({
    kofi: nullableUrl.optional(),
    patreon: nullableUrl.optional(),
    bmc: nullableUrl.optional(),
  }),
});

export const dashboardLevelingSchema = z
  .object({
    enabled: z.boolean(),
    levelUpChannelId: z.string().regex(/^\d{17,20}$/).nullable(),
    ignoredChannelIds: z.array(z.string().regex(/^\d{17,20}$/)).max(250),
    xpMin: z.number().int().min(1).max(1000),
    xpMax: z.number().int().min(1).max(1000),
    cooldownSeconds: z.number().int().min(5).max(3600),
    announceLevelUps: z.boolean(),
  })
  .refine((value) => value.xpMax >= value.xpMin, {
    path: ["xpMax"],
    message: "Maximum XP must be at least the minimum XP.",
  })
  .refine((value) => !value.enabled || Boolean(value.levelUpChannelId), {
    path: ["levelUpChannelId"],
    message: "Choose a level-up channel before enabling leveling.",
  });

export const controlCenterSaveSchema = z.object({
  config: controlCenterConfigSchema,
  leveling: dashboardLevelingSchema,
});
