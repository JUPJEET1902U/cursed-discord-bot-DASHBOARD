import { z } from "zod";

export const aiProviderSchema = z.enum(["auto", "groq", "gemini"]);

export const aiSettingsConfigSchema = z.object({
  enabled: z.boolean(),
  provider: aiProviderSchema,
  personality: z
    .string()
    .max(2000, "Personality must be 2000 characters or fewer."),
  maxTokens: z
    .number()
    .int("Max tokens must be a whole number.")
    .min(64, "Max tokens must be at least 64.")
    .max(4096, "Max tokens must be 4096 or fewer."),
  temperature: z
    .number()
    .min(0, "Temperature must be at least 0.")
    .max(2, "Temperature must be 2 or lower."),
  longTermMemory: z.boolean(),
  vision: z.boolean(),
  replyInThreads: z.boolean(),
});

export type AISettingsConfigInput = z.infer<typeof aiSettingsConfigSchema>;
