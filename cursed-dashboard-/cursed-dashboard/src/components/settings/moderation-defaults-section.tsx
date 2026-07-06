"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ModerationDefaultsSettings } from "@/types/guild-settings";

interface ModerationDefaultsSectionProps {
  config: ModerationDefaultsSettings;
  onChange: (next: ModerationDefaultsSettings) => void;
  errors: Partial<Record<"timeoutMinutes" | "warningThreshold", string>>;
  disabled?: boolean;
}

/**
 * Guild-wide moderation defaults. Pure config — this dashboard never times
 * out, warns, or otherwise moderates a member itself; the bot reads these
 * as the starting values its own moderation commands fall back to.
 */
export function ModerationDefaultsSection({
  config,
  onChange,
  errors,
  disabled,
}: ModerationDefaultsSectionProps) {
  function patch(partial: Partial<ModerationDefaultsSettings>) {
    onChange({ ...config, ...partial });
  }

  return (
    <DashboardCard
      title="Moderation Defaults"
      description="Fallback values the bot's moderation commands use in this server."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="settings-mod-enabled">
              Enable moderation features
            </Label>
            <p className="mt-0.5 text-xs text-ash">
              Master switch for the bot's moderation commands.
            </p>
          </div>
          <Switch
            id="settings-mod-enabled"
            checked={config.enabled}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ enabled: checked })}
          />
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-mod-timeout">
              Default timeout duration
            </Label>
            <span className="font-mono text-xs text-ash">
              {config.timeoutMinutes} min
            </span>
          </div>
          <input
            id="settings-mod-timeout"
            type="range"
            min={1}
            max={1440}
            step={1}
            value={Math.min(config.timeoutMinutes, 1440)}
            disabled={disabled}
            onChange={(e) =>
              patch({ timeoutMinutes: Number(e.target.value) })
            }
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-steel/60 accent-violet disabled:cursor-not-allowed"
            aria-valuetext={`${config.timeoutMinutes} minutes`}
          />
          <p className="mt-1.5 text-xs text-ash">
            Pre-filled duration when a moderator times someone out without
            specifying one. Slider covers up to 24h — type a longer value
            below, up to Discord's 28-day maximum.
          </p>
          <input
            type="number"
            min={1}
            max={40320}
            value={config.timeoutMinutes}
            disabled={disabled}
            onChange={(e) =>
              patch({ timeoutMinutes: Number(e.target.value) || 1 })
            }
            className="mt-2 h-9 w-28 rounded-lg border border-white/10 bg-steel/60 px-3 text-sm text-fog focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.timeoutMinutes ? (
            <p className="mt-1.5 text-xs text-crimson-bright">
              {errors.timeoutMinutes}
            </p>
          ) : null}
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-mod-warning-threshold">
              Default warning threshold
            </Label>
            <span className="font-mono text-xs text-ash">
              {config.warningThreshold}
            </span>
          </div>
          <input
            id="settings-mod-warning-threshold"
            type="range"
            min={1}
            max={20}
            step={1}
            value={config.warningThreshold}
            disabled={disabled}
            onChange={(e) =>
              patch({ warningThreshold: Number(e.target.value) })
            }
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-steel/60 accent-violet disabled:cursor-not-allowed"
            aria-valuetext={`${config.warningThreshold} warnings`}
          />
          <p className="mt-1.5 text-xs text-ash">
            Number of warnings before the bot's escalation kicks in (e.g.
            automatic timeout).
          </p>
          {errors.warningThreshold ? (
            <p className="mt-1.5 text-xs text-crimson-bright">
              {errors.warningThreshold}
            </p>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  );
}
