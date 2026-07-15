import { z } from "zod";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const SNOWFLAKE = /^\d{17,20}$/;

/**
 * Validates the exact flat `WelcomeConfig` shape (see `@/types/welcome`) —
 * the same top-level fields stored on the `guildConfigs` document and read
 * by the live bot's GuildConfigStore. There is no separate "enabled" flag
 * or nested "embed" object here: the bot treats welcome as enabled when
 * `welcomeChannelId` is set, and the embed is simply built from these same
 * top-level fields.
 */
export const welcomeConfigSchema = z.object({
  welcomeChannelId: z
    .string()
    .regex(SNOWFLAKE, "Invalid channel ID.")
    .nullable(),
  welcomeMessage: z
    .string()
    .max(2000, "Message must be 2000 characters or fewer.")
    .nullable(),
  welcomeUseAI: z.boolean(),
  welcomeColor: z
    .string()
    .regex(HEX_COLOR, "Color must be a hex value, e.g. #7C3AED.")
    .nullable(),
  welcomeThumbnail: z.boolean(),
  welcomeImageUrl: z
    .string()
    .max(2048, "Image URL is too long.")
    .refine((val) => val === "" || /^https?:\/\/\S+$/i.test(val), {
      message: "Image URL must be empty or a valid http(s) URL.",
    })
    .nullable(),
  welcomeFooter: z
    .string()
    .max(2048, "Footer text must be 2048 characters or fewer.")
    .nullable(),
});

export type WelcomeConfigInput = z.infer<typeof welcomeConfigSchema>;
