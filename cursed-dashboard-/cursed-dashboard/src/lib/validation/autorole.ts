import { z } from "zod";

const SNOWFLAKE = /^\d{17,20}$/;

export const autoroleConfigSchema = z
  .object({
    enabled: z.boolean(),
    roleIds: z
      .array(z.string().regex(SNOWFLAKE, "Invalid role ID."))
      .max(25, "You can select at most 25 roles.")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Duplicate roles aren't allowed.",
      }),
    requireAll: z.boolean(),
  })
  .refine((data) => !data.enabled || data.roleIds.length > 0, {
    message: "Select at least one role before enabling autorole.",
    path: ["roleIds"],
  });

export type AutoroleConfigInput = z.infer<typeof autoroleConfigSchema>;
