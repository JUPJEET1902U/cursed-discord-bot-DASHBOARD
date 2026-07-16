import { z } from "zod";

const SNOWFLAKE = /^\d{17,20}$/;

export const autoroleConfigSchema = z
  .object({
    autoroleId: z.string().regex(SNOWFLAKE, "Invalid role ID.").nullable(),
  })
  .strict();

export type AutoroleConfigInput = z.infer<typeof autoroleConfigSchema>;
