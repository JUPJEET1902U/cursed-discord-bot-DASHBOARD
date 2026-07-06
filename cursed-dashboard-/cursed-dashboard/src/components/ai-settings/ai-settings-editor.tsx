"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsEditor } from "@/hooks/use-settings-editor";
import { cn } from "@/lib/utils";
import { AI_PROVIDER_LABELS, type AISettingsConfig, type AIProvider } from "@/types/ai-settings";

interface AISettingsEditorProps {
  guildId: string;
  initialConfig: AISettingsConfig;
}

type FieldErrors = Partial<{
  personality: string;
  maxTokens: string;
  temperature: string;
}>;

/**
 * Mirrors `aiSettingsConfigSchema` (`src/lib/validation/ai-settings.ts`) for
 * instant client-side feedback. The server re-validates with the actual Zod
 * schema on every save — this is purely a UX nicety, never trusted as the
 * source of truth. This intentionally follows the same "duplicate a subset
 * of the schema's rules by hand" pattern already used in `WelcomeEditor` /
 * `AutoroleEditor`, for consistency with the rest of the codebase.
 */
function validate(config: AISettingsConfig): FieldErrors {
  const errors: FieldErrors = {};

  if (config.personality.length > 2000) {
    errors.personality = "Personality must be 2000 characters or fewer.";
  }
  if (!Number.isInteger(config.maxTokens) || config.maxTokens < 64 || config.maxTokens > 4096) {
    errors.maxTokens = "Max tokens must be a whole number between 64 and 4096.";
  }
  if (config.temperature < 0 || config.temperature > 2) {
    errors.temperature = "Temperature must be between 0 and 2.";
  }

  return errors;
}

export function AISettingsEditor({
  guildId,
  initialConfig,
}: AISettingsEditorProps) {
  const {
    config,
    patch,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    handleSave,
    handleReset,
  } = useSettingsEditor({
    endpoint: `/api/guilds/${guildId}/ai-settings`,
    initialConfig,
    validate,
    successTitle: "AI settings saved",
    genericErrorMessage: "Couldn't save AI settings.",
  });

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={handleSave}
        onReset={handleReset}
      />

      <ServerErrorBanner message={serverError} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <DashboardCard
            title="General"
            description="Turn the AI assistant on and choose which provider handles it."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="ai-enabled">Enable AI</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    When off, the bot never calls an AI provider in this server.
                  </p>
                </div>
                <Switch
                  id="ai-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => patch({ enabled: checked })}
                />
              </div>

              <fieldset
                disabled={!config.enabled}
                className={cn(
                  "space-y-5 transition-opacity",
                  !config.enabled && "pointer-events-none opacity-40"
                )}
              >
                <div>
                  <Label htmlFor="ai-provider">Provider</Label>
                  <div className="mt-1.5">
                    <Select
                      value={config.provider}
                      onValueChange={(value) =>
                        patch({ provider: value as AIProvider })
                      }
                    >
                      <SelectTrigger id="ai-provider">
                        <SelectValue placeholder="Select a provider..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(AI_PROVIDER_LABELS) as AIProvider[]).map(
                          (provider) => (
                            <SelectItem key={provider} value={provider}>
                              {AI_PROVIDER_LABELS[provider]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="mt-1.5 text-xs text-ash">
                    &quot;Auto&quot; lets the bot pick the best available
                    provider on its own.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="ai-threads">Reply in threads</Label>
                    <p className="mt-0.5 text-xs text-ash">
                      Replies are posted in a thread instead of the channel.
                    </p>
                  </div>
                  <Switch
                    id="ai-threads"
                    checked={config.replyInThreads}
                    onCheckedChange={(checked) =>
                      patch({ replyInThreads: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="ai-memory">Long-term memory</Label>
                    <p className="mt-0.5 text-xs text-ash">
                      Lets the bot remember details across separate conversations.
                    </p>
                  </div>
                  <Switch
                    id="ai-memory"
                    checked={config.longTermMemory}
                    onCheckedChange={(checked) =>
                      patch({ longTermMemory: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="ai-vision">Vision</Label>
                    <p className="mt-0.5 text-xs text-ash">
                      Lets the bot look at images shared in the conversation.
                    </p>
                  </div>
                  <Switch
                    id="ai-vision"
                    checked={config.vision}
                    onCheckedChange={(checked) => patch({ vision: checked })}
                  />
                </div>
              </fieldset>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Personality"
            description="Freeform description of how the bot should talk and behave."
          >
            <fieldset
              disabled={!config.enabled}
              className={cn(
                "transition-opacity",
                !config.enabled && "pointer-events-none opacity-40"
              )}
            >
              <Label htmlFor="ai-personality" className="sr-only">
                Personality
              </Label>
              <Textarea
                id="ai-personality"
                value={config.personality}
                onChange={(e) => patch({ personality: e.target.value })}
                placeholder="Friendly, a little playful, and helpful — keep replies concise."
                rows={4}
                maxLength={2000}
              />
              <div className="mt-1.5 flex items-center justify-end">
                <span
                  className={cn(
                    "shrink-0 pl-3 text-xs text-ash",
                    config.personality.length > 2000 && "text-crimson-bright"
                  )}
                >
                  {config.personality.length}/2000
                </span>
              </div>
              {errors.personality ? (
                <p className="mt-1.5 text-xs text-crimson-bright">
                  {errors.personality}
                </p>
              ) : null}
            </fieldset>
          </DashboardCard>

          <DashboardCard
            title="Generation"
            description="Controls how long and how creative the bot's replies are."
          >
            <fieldset
              disabled={!config.enabled}
              className={cn(
                "space-y-6 transition-opacity",
                !config.enabled && "pointer-events-none opacity-40"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-max-tokens">Max tokens</Label>
                  <span className="font-mono text-xs text-ash">
                    {config.maxTokens}
                  </span>
                </div>
                <input
                  id="ai-max-tokens"
                  type="range"
                  min={64}
                  max={4096}
                  step={64}
                  value={config.maxTokens}
                  onChange={(e) => patch({ maxTokens: Number(e.target.value) })}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-steel/60 accent-violet"
                  aria-valuetext={`${config.maxTokens} tokens`}
                />
                <p className="mt-1.5 text-xs text-ash">
                  The upper limit on how long a single reply can be. Higher
                  values cost more per reply.
                </p>
                {errors.maxTokens ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.maxTokens}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-temperature">Temperature</Label>
                  <span className="font-mono text-xs text-ash">
                    {config.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  id="ai-temperature"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.temperature}
                  onChange={(e) =>
                    patch({ temperature: Number(e.target.value) })
                  }
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-steel/60 accent-violet"
                  aria-valuetext={`${config.temperature.toFixed(1)}`}
                />
                <p className="mt-1.5 text-xs text-ash">
                  Lower is more focused and predictable; higher is more
                  varied and creative.
                </p>
                {errors.temperature ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.temperature}
                  </p>
                ) : null}
              </div>
            </fieldset>
          </DashboardCard>

          <div className="flex justify-end">
            <EditorActions
              dirty={dirty}
              saving={saving}
              hasErrors={hasErrors}
              onSave={handleSave}
              onReset={handleReset}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <DashboardCard
              title="About these settings"
              description="What each toggle actually does."
            >
              <ul className="space-y-3 text-xs text-ash">
                <li>
                  <span className="font-medium text-fog">Provider:</span>{" "}
                  which AI service the bot calls. &quot;Auto&quot; picks
                  whichever is configured and available.
                </li>
                <li>
                  <span className="font-medium text-fog">Personality:</span>{" "}
                  sent to the provider as guidance for tone — not guaranteed
                  verbatim output.
                </li>
                <li>
                  <span className="font-medium text-fog">Max tokens:</span>{" "}
                  a hard ceiling on reply length, enforced by the provider.
                </li>
                <li>
                  <span className="font-medium text-fog">Temperature:</span>{" "}
                  randomness in word choice. 0 is deterministic, 2 is very
                  varied.
                </li>
                <li>
                  <span className="font-medium text-fog">
                    Long-term memory:
                  </span>{" "}
                  the bot may recall facts from earlier conversations in
                  later ones.
                </li>
                <li>
                  <span className="font-medium text-fog">Vision:</span> the
                  bot can read images shared alongside a message.
                </li>
                <li>
                  <span className="font-medium text-fog">
                    Reply in threads:
                  </span>{" "}
                  keeps AI replies out of the main channel flow.
                </li>
              </ul>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs text-ash">
                These are stored as configuration only — this dashboard never
                calls an AI provider itself. The bot reads these settings and
                does the actual generation.
              </p>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
