/**
 * Shape for the `aiSettings` sub-document inside `guildConfigs` (same
 * collection/contract as `welcome`/`autorole` — see `docs/ARCHITECTURE.md`).
 *
 * Pure configuration — this dashboard never calls Groq/Gemini/OpenAI (or any
 * other AI provider) and never talks to the bot process. The bot reads this
 * exact shape from MongoDB on its own schedule and is the only thing that
 * actually makes AI calls. Field names/types here are the contract;
 * coordinate with the bot codebase before renaming anything.
 */

export type AIProvider = "auto" | "groq" | "gemini";

/** Shared display labels for the provider enum — used by both the AI
 * Settings editor and the Server Settings "provider preference" default,
 * so the two pages never drift out of sync with each other. */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  auto: "Auto (recommended)",
  groq: "Groq",
  gemini: "Gemini",
};

export interface AISettingsConfig {
  enabled: boolean;
  provider: AIProvider;
  /** Freeform system-prompt-style description of how the bot should talk. */
  personality: string;
  maxTokens: number;
  /** 0–2, one decimal place of meaningful precision (e.g. 0.7). */
  temperature: number;
  longTermMemory: boolean;
  vision: boolean;
  replyInThreads: boolean;
}

export const DEFAULT_AI_SETTINGS_CONFIG: AISettingsConfig = {
  enabled: false,
  provider: "auto",
  personality:
    "Friendly, a little playful, and helpful — keep replies concise.",
  maxTokens: 512,
  temperature: 0.7,
  longTermMemory: false,
  vision: false,
  replyInThreads: false,
};
