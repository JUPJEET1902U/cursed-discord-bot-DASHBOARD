import { z } from "zod";

const SNOWFLAKE = /^\d{17,20}$/;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const warningThresholdSchema = z
  .object({
    warnings: z.number().int().min(1).max(100),
    action: z.enum(["timeout", "kick", "ban"]),
    durationMinutes: z.number().int().min(1).max(40320).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === "timeout" && value.durationMinutes === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationMinutes"],
        message: "Timeout thresholds require a duration.",
      });
    }
  });

export const moderationConfigSchema = z
  .object({
    moderationCommandsEnabled: z.boolean(),
    moderatorRoleIds: z.array(z.string().regex(SNOWFLAKE)).max(25),
    modLogChannelId: z.string().regex(SNOWFLAKE).nullable(),
    defaultTimeoutMinutes: z.number().int().min(1).max(40320),
    dmPunishedUsers: z.boolean(),
    requireModerationReason: z.boolean(),
    warningEscalationEnabled: z.boolean(),
    warningThresholds: z.array(warningThresholdSchema).max(10),
    antiSpam: z.boolean(),
    antiLink: z.boolean(),
    antiInvite: z.boolean(),
    linkWhitelist: z
      .array(z.string().trim().toLowerCase().max(253).regex(DOMAIN, "Enter a domain such as example.com."))
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<number>();
    value.warningThresholds.forEach((threshold, index) => {
      if (seen.has(threshold.warnings)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["warningThresholds", index, "warnings"],
          message: "Warning counts must be unique.",
        });
      }
      seen.add(threshold.warnings);
    });
  });

export const moderationCaseOperationSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("reason"), reason: z.string().trim().min(1).max(2000) }).strict(),
  z.object({ operation: z.literal("revoke"), reason: z.string().trim().max(1000).nullable().optional() }).strict(),
  z.object({ operation: z.literal("delete") }).strict(),
]);
