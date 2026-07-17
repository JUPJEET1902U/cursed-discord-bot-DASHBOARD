import { z } from "zod";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const SNOWFLAKE = /^\d{17,20}$/;
const nullableUrl = z
  .string()
  .max(2048, "URL is too long.")
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
    message: "Enter a valid http(s) URL or leave it blank.",
  })
  .nullable();

export const welcomeConfigSchema = z
  .object({
    welcomeEnabled: z.boolean(),
    welcomeChannelId: z.string().regex(SNOWFLAKE, "Invalid channel ID.").nullable(),
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
    welcomeImageUrl: nullableUrl,
    welcomeFooter: z
      .string()
      .max(2048, "Footer text must be 2048 characters or fewer.")
      .nullable(),
    welcomeCardEnabled: z.boolean(),
    welcomeCardTheme: z.enum(["classic", "midnight", "neon"]),
    welcomeCardBackground: nullableUrl,
    welcomeAccentColor: z
      .string()
      .regex(HEX_COLOR, "Accent must be a hex value, e.g. #A855F7.")
      .nullable(),
    welcomeMediaUrl: nullableUrl,
  })
  .refine((value) => !value.welcomeEnabled || Boolean(value.welcomeChannelId), {
    path: ["welcomeChannelId"],
    message: "Choose a welcome channel before enabling welcome messages.",
  });

export type WelcomeConfigInput = z.infer<typeof welcomeConfigSchema>;
