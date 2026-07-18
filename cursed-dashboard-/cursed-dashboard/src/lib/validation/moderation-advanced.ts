import { z } from "zod";

const snowflake = z.string().regex(/^\d{17,20}$/, "Enter a valid Discord ID.");

const commandTogglesSchema = z
  .object({
    purge: z.boolean(),
    lock: z.boolean(),
    unlock: z.boolean(),
    slowmode: z.boolean(),
    nickname: z.boolean(),
    tempban: z.boolean(),
    softban: z.boolean(),
    note: z.boolean(),
    history: z.boolean(),
  })
  .strict();

const loggingSchema = z
  .object({
    messageDeleteEnabled: z.boolean(),
    messageEditEnabled: z.boolean(),
    memberUpdateEnabled: z.boolean(),
    storeDeletedMessageContent: z.boolean(),
    messageLogChannelId: z.union([snowflake, z.null()]),
    memberLogChannelId: z.union([snowflake, z.null()]),
  })
  .strict();

const whitelistSchema = z
  .object({
    enabled: z.boolean(),
    userIds: z.array(snowflake).max(100),
    roleIds: z.array(snowflake).max(50),
    channelIds: z.array(snowflake).max(100),
    botIds: z.array(snowflake).max(100),
    exemptFromAutomod: z.boolean(),
    protectFromManualModeration: z.boolean(),
  })
  .strict();

export const advancedModerationConfigSchema = z
  .object({
    advancedModerationEnabled: z.boolean(),
    maxPurgeAmount: z.number().int().min(1).max(100),
    tempBansEnabled: z.boolean(),
    softbansEnabled: z.boolean(),
    moderatorNotesEnabled: z.boolean(),
    dangerousCommandsAdminOnly: z.boolean(),
    commandToggles: commandTogglesSchema,
    logging: loggingSchema,
    whitelist: whitelistSchema,
  })
  .strict();

export const advancedCaseOperationSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("note"),
      note: z.string().trim().min(1).max(2000),
    })
    .strict(),
  z
    .object({
      operation: z.literal("evidence"),
      evidenceUrl: z.union([z.string().trim().url().max(2048), z.null()]),
    })
    .strict(),
]);
