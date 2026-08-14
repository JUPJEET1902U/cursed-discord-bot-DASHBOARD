import { z } from "zod";
import { LOG_CATEGORY_KEYS } from "@/types/logs";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const SNOWFLAKE = /^\d{17,20}$/;

export const logCategoryConfigSchema = z
  .object({
    enabled: z.boolean(),
    channelId: z.string().regex(SNOWFLAKE, "Invalid channel ID.").nullable(),
    embed: z.boolean(),
    color: z.string().regex(HEX_COLOR, "Color must be a hex value, e.g. #8B5CF6."),
    ignoreBots: z.boolean(),
    includeContent: z.boolean(),
  })
  .refine((data) => !data.enabled || data.channelId !== null, {
    message: "Choose a log channel before enabling this category.",
    path: ["channelId"],
  });

export type LogCategoryConfigInput = z.infer<typeof logCategoryConfigSchema>;

export const logsConfigSchema = z.object(
  Object.fromEntries(
    LOG_CATEGORY_KEYS.map((key) => [key, logCategoryConfigSchema])
  ) as Record<(typeof LOG_CATEGORY_KEYS)[number], typeof logCategoryConfigSchema>
);

export type LogsConfigInput = z.infer<typeof logsConfigSchema>;
