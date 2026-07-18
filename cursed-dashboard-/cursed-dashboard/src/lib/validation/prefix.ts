import { z } from "zod";

export const prefixSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, "Enter a prefix.")
    .max(5, "Use 5 characters or fewer.")
    .regex(
      /^[^\s/\\`<>@#]{1,5}$/,
      "Do not use spaces, slashes, mentions, angle brackets, or backticks."
    ),
});
