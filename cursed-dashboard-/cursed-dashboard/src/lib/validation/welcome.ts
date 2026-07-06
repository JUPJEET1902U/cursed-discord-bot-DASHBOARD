import { z } from "zod";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const SNOWFLAKE = /^\d{17,20}$/;

export const welcomeEmbedSchema = z.object({
  enabled: z.boolean(),
  title: z
    .string()
    .max(256, "Embed title must be 256 characters or fewer."),
  description: z
    .string()
    .max(4096, "Embed description must be 4096 characters or fewer."),
  color: z
    .string()
    .regex(HEX_COLOR, "Color must be a hex value, e.g. #7C3AED."),
  thumbnail: z.boolean(),
  footer: z
    .string()
    .max(2048, "Footer text must be 2048 characters or fewer."),
  imageUrl: z
    .string()
    .max(2048, "Image URL is too long.")
    .refine((val) => val === "" || /^https?:\/\/\S+$/i.test(val), {
      message: "Image URL must be empty or a valid http(s) URL.",
    }),
});

export const welcomeConfigSchema = z
  .object({
    enabled: z.boolean(),
    channelId: z
      .string()
      .regex(SNOWFLAKE, "Invalid channel ID.")
      .nullable(),
    message: z
      .string()
      .max(2000, "Message must be 2000 characters or fewer."),
    mentionUser: z.boolean(),
    embed: welcomeEmbedSchema,
  })
  .refine((data) => !data.enabled || data.channelId !== null, {
    message: "Choose a welcome channel before enabling welcome messages.",
    path: ["channelId"],
  });

export type WelcomeConfigInput = z.infer<typeof welcomeConfigSchema>;
