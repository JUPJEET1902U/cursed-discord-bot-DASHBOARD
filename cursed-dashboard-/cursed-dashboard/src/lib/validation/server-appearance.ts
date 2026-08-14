import { z } from "zod";

const appearanceMediaSchema = z
  .string()
  .min(1, "Choose an image URL or upload a local file.")
  .max(245_000, "Optimized image data is too large.")
  .refine(
    (value) => value.startsWith("data:image/") || value.startsWith("https://"),
    "Use a public HTTPS image URL or a local image upload."
  )
  .nullable();

export const serverAppearanceUpdateSchema = z
  .object({
    avatar: appearanceMediaSchema.optional(),
    banner: appearanceMediaSchema.optional(),
    bio: z.string().max(190, "Bio must be 190 characters or fewer.").nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one appearance field to update.",
  });
