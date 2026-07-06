"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_PROVIDER_LABELS, type AIProvider } from "@/types/ai-settings";
import type { AIDefaultsSettings } from "@/types/guild-settings";

interface AIDefaultsSectionProps {
  config: AIDefaultsSettings;
  onChange: (next: AIDefaultsSettings) => void;
  errors: Partial<Record<"personality" | "cooldown", string>>;
  disabled?: boolean;
}

/**
 * Defaults new AI-chat configuration inherits from, kept intentionally
 * separate from the full per-guild `aiSettings` document (Step 8) — these
 * are guild-wide fallbacks the bot applies, not the live feature toggle
 * itself. "Provider preference" in particular is reserved for future
 * multi-provider routing and has no effect yet.
 */
export function AIDefaultsSection({
  config,
  onChange,
  errors,
  disabled,
}: AIDefaultsSectionProps) {
  function patch(partial: Partial<AIDefaultsSettings>) {
    onChange({ ...config, ...partial });
  }

  return (
    <DashboardCard
      title="AI Defaults"
      description="Fallback values the bot applies for AI chat in this server."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="settings-ai-enabled">AI enabled by default</Label>
            <p className="mt-0.5 text-xs text-ash">
              Starting state for AI chat when no per-guild override exists.
            </p>
          </div>
          <Switch
            id="settings-ai-enabled"
            checked={config.enabled}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ enabled: checked })}
          />
        </div>

        <div>
          <Label htmlFor="settings-ai-personality">Default personality</Label>
          <Textarea
            id="settings-ai-personality"
            value={config.personality}
            disabled={disabled}
            onChange={(e) => patch({ personality: e.target.value })}
            maxLength={2000}
            rows={3}
            className="mt-1.5"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-ash">
            <span>Freeform tone/style guidance for the AI.</span>
            <span className="font-mono">
              {config.personality.length}/2000
            </span>
          </div>
          {errors.personality ? (
            <p className="mt-1.5 text-xs text-crimson-bright">
              {errors.personality}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
          <div>
            <Label htmlFor="settings-ai-memory">Memory enabled</Label>
            <p className="mt-0.5 text-xs text-ash">
              Whether the bot retains long-term conversation memory by
              default.
            </p>
          </div>
          <Switch
            id="settings-ai-memory"
            checked={config.memory}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ memory: checked })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="settings-ai-mention-only">
              Mention-only mode
            </Label>
            <p className="mt-0.5 text-xs text-ash">
              The bot only replies to AI chat when directly @mentioned.
            </p>
          </div>
          <Switch
            id="settings-ai-mention-only"
            checked={config.mentionOnly}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ mentionOnly: checked })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-ai-cooldown">Cooldown</Label>
            <span className="font-mono text-xs text-ash">
              {config.cooldown}s
            </span>
          </div>
          <input
            id="settings-ai-cooldown"
            type="range"
            min={0}
            max={120}
            step={1}
            value={Math.min(config.cooldown, 120)}
            disabled={disabled}
            onChange={(e) => patch({ cooldown: Number(e.target.value) })}
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-steel/60 accent-violet disabled:cursor-not-allowed"
            aria-valuetext={`${config.cooldown} seconds`}
          />
          <p className="mt-1.5 text-xs text-ash">
            Minimum seconds between AI replies to the same user. Drag to 120s
            for the slider — type a larger value below if you need one, up
            to 3600s.
          </p>
          <input
            type="number"
            min={0}
            max={3600}
            value={config.cooldown}
            disabled={disabled}
            onChange={(e) => patch({ cooldown: Number(e.target.value) || 0 })}
            className="mt-2 h-9 w-28 rounded-lg border border-white/10 bg-steel/60 px-3 text-sm text-fog focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.cooldown ? (
            <p className="mt-1.5 text-xs text-crimson-bright">
              {errors.cooldown}
            </p>
          ) : null}
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <Label htmlFor="settings-ai-provider">Provider preference</Label>
          <div className="mt-1.5">
            <Select
              value={config.providerPreference}
              onValueChange={(value) =>
                patch({ providerPreference: value as AIProvider })
              }
            >
              <SelectTrigger id="settings-ai-provider" disabled={disabled}>
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
            Reserved for future multi-provider routing — the bot doesn&apos;t
            act on this yet.
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
