"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/welcome/color-picker";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import type { FeatureToggles, GeneralSettings } from "@/types/guild-settings";

interface GeneralSectionProps {
  guildName: string;
  config: GeneralSettings;
  onChange: (next: GeneralSettings) => void;
  errors: Partial<Record<"displayName" | "accentColor" | "embedColor" | "timezone", string>>;
  disabled?: boolean;
}

const FEATURE_TOGGLE_LABELS: Record<
  keyof FeatureToggles,
  { label: string; description: string }
> = {
  welcomeMessages: {
    label: "Welcome messages",
    description: "Master switch for the Welcome feature.",
  },
  autorole: {
    label: "Autorole",
    description: "Master switch for automatic role assignment.",
  },
  aiChat: {
    label: "AI chat",
    description: "Master switch for the AI assistant.",
  },
  moderation: {
    label: "Moderation",
    description: "Master switch for moderation actions.",
  },
  logging: {
    label: "Logging",
    description: "Master switch for the event log.",
  },
};

/**
 * General settings section: cosmetic/dashboard fields plus per-module
 * master switches. Feature toggles here are layered on top of each
 * feature's own `enabled` flag — see the comment on `FeatureToggles` in
 * `src/types/guild-settings.ts` for how the bot is expected to combine them.
 */
export function GeneralSection({
  guildName,
  config,
  onChange,
  errors,
  disabled,
}: GeneralSectionProps) {
  function patch(partial: Partial<GeneralSettings>) {
    onChange({ ...config, ...partial });
  }

  function patchToggle(key: keyof FeatureToggles, value: boolean) {
    patch({ featureToggles: { ...config.featureToggles, [key]: value } });
  }

  return (
    <>
      <DashboardCard
        title="General"
        description="Dashboard-facing basics for this server."
      >
        <div className="space-y-5">
          <div>
            <Label htmlFor="settings-display-name">Server display name</Label>
            <Input
              id="settings-display-name"
              value={config.displayName}
              disabled={disabled}
              onChange={(e) => patch({ displayName: e.target.value })}
              placeholder={guildName}
              maxLength={100}
              className="mt-1.5"
            />
            <p className="mt-1.5 text-xs text-ash">
              Shown only in this dashboard — it never renames your actual
              Discord server. Leave blank to just show &quot;{guildName}
              &quot;.
            </p>
            {errors.displayName ? (
              <p className="mt-1.5 text-xs text-crimson-bright">
                {errors.displayName}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="settings-accent-color">
                Dashboard accent color
              </Label>
              <div className="mt-1.5">
                <ColorPicker
                  value={config.accentColor}
                  disabled={disabled}
                  onChange={(color) => patch({ accentColor: color })}
                />
              </div>
              <p className="mt-1.5 text-xs text-ash">
                Used for this guild&apos;s highlights within the dashboard
                UI only.
              </p>
              {errors.accentColor ? (
                <p className="mt-1.5 text-xs text-crimson-bright">
                  {errors.accentColor}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="settings-embed-color">
                Default embed color
              </Label>
              <div className="mt-1.5">
                <ColorPicker
                  value={config.embedColor}
                  disabled={disabled}
                  onChange={(color) => patch({ embedColor: color })}
                />
              </div>
              <p className="mt-1.5 text-xs text-ash">
                Fallback color the bot uses for embeds that don&apos;t set
                their own.
              </p>
              {errors.embedColor ? (
                <p className="mt-1.5 text-xs text-crimson-bright">
                  {errors.embedColor}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="settings-timezone">Timezone</Label>
              <div className="mt-1.5">
                <Select
                  value={config.timezone}
                  onValueChange={(value) => patch({ timezone: value })}
                >
                  <SelectTrigger id="settings-timezone" disabled={disabled}>
                    <SelectValue placeholder="Select a timezone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1.5 text-xs text-ash">
                Used by the bot to format timestamps shown to your members.
              </p>
              {errors.timezone ? (
                <p className="mt-1.5 text-xs text-crimson-bright">
                  {errors.timezone}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="settings-language">Default language</Label>
              <div className="mt-1.5">
                <Select value={config.language} disabled>
                  <SelectTrigger id="settings-language" disabled>
                    <SelectValue placeholder="English" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1.5 text-xs text-ash">
                More languages are coming soon.
              </p>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Feature toggles"
        description="Instantly mute a whole module without losing its saved configuration."
      >
        <div className="space-y-1">
          {(Object.keys(FEATURE_TOGGLE_LABELS) as (keyof FeatureToggles)[]).map(
            (key, i) => (
              <div
                key={key}
                className={
                  i > 0
                    ? "flex items-center justify-between gap-4 border-t border-white/[0.06] py-3.5"
                    : "flex items-center justify-between gap-4 pb-3.5"
                }
              >
                <div>
                  <Label htmlFor={`settings-toggle-${key}`}>
                    {FEATURE_TOGGLE_LABELS[key].label}
                  </Label>
                  <p className="mt-0.5 text-xs text-ash">
                    {FEATURE_TOGGLE_LABELS[key].description}
                  </p>
                </div>
                <Switch
                  id={`settings-toggle-${key}`}
                  checked={config.featureToggles[key]}
                  disabled={disabled}
                  onCheckedChange={(checked) => patchToggle(key, checked)}
                />
              </div>
            )
          )}
        </div>
      </DashboardCard>
    </>
  );
}
