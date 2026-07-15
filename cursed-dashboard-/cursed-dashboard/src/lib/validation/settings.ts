import { z } from "zod";
import { aiProviderSchema } from "@/lib/validation/ai-settings";
import { SUPPORTED_LANGUAGES } from "@/types/guild-settings";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * Validated with the runtime's own IANA timezone database rather than a
 * hand-maintained list, so every zone Node/ICU actually knows about is
 * accepted — not just the curated shortlist the dropdown shows. Computed
 * once at module load (this list doesn't change without a Node upgrade).
 */
const VALID_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

const timezoneSchema = z
  .string()
  .refine((tz) => VALID_TIMEZONES.has(tz), "Not a recognized timezone.");

const languageSchema = z.enum(SUPPORTED_LANGUAGES);

const featureTogglesSchema = z.object({
  welcomeMessages: z.boolean(),
  autorole: z.boolean(),
  aiChat: z.boolean(),
  moderation: z.boolean(),
  logging: z.boolean(),
});

export const generalSettingsSchema = z.object({
  displayName: z
    .string()
    .max(100, "Display name must be 100 characters or fewer."),
  accentColor: z
    .string()
    .regex(HEX_COLOR, "Color must be a hex value, e.g. #8B5CF6."),
  embedColor: z
    .string()
    .regex(HEX_COLOR, "Color must be a hex value, e.g. #8B5CF6."),
  timezone: timezoneSchema,
  language: languageSchema,
  featureToggles: featureTogglesSchema,
});

export const aiDefaultsSettingsSchema = z.object({
  enabled: z.boolean(),
  personality: z
    .string()
    .max(2000, "Personality must be 2000 characters or fewer."),
  memory: z.boolean(),
  mentionOnly: z.boolean(),
  cooldown: z
    .number()
    .int("Cooldown must be a whole number of seconds.")
    .min(0, "Cooldown can't be negative.")
    .max(3600, "Cooldown must be 3600 seconds (1 hour) or less."),
  providerPreference: aiProviderSchema,
});

export const moderationDefaultsSettingsSchema = z.object({
  enabled: z.boolean(),
  timeoutMinutes: z
    .number()
    .int("Timeout must be a whole number of minutes.")
    .min(1, "Timeout must be at least 1 minute.")
    // Discord's own max timeout duration is 28 days.
    .max(40320, "Timeout can't exceed 28 days (40320 minutes)."),
  warningThreshold: z
    .number()
    .int("Warning threshold must be a whole number.")
    .min(1, "Warning threshold must be at least 1.")
    .max(20, "Warning threshold must be 20 or fewer."),
});

export const guildSettingsSchema = z.object({
  general: generalSettingsSchema,
  aiDefaults: aiDefaultsSettingsSchema,
  moderationDefaults: moderationDefaultsSettingsSchema,
});

export type GuildSettingsInput = z.infer<typeof guildSettingsSchema>;
