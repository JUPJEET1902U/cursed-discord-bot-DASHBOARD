"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/welcome/color-picker";
import { LogChannelSelect } from "@/components/logs/log-channel-select";
import { cn } from "@/lib/utils";
import type { DiscordChannel } from "@/types/discord";
import type { LogCategoryConfig, LogCategoryMeta } from "@/types/logs";

interface LogCategoryRowProps {
  meta: LogCategoryMeta;
  config: LogCategoryConfig;
  channels: DiscordChannel[] | null;
  channelError?: string;
  onChange: (next: LogCategoryConfig) => void;
  disabled?: boolean;
}

/**
 * One collapsible row per logging category. Always shows the name + enable
 * switch; the channel/embed/color/ignore-bots controls reveal underneath
 * (height + opacity transition) once enabled, so a page with 17 categories
 * doesn't read as a wall of identical open forms.
 */
export function LogCategoryRow({
  meta,
  config,
  channels,
  channelError,
  onChange,
  disabled,
}: LogCategoryRowProps) {
  const fieldId = `log-${meta.key}`;

  function patch(partial: Partial<LogCategoryConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors duration-200",
        config.enabled
          ? "border-violet/30 bg-violet/[0.04]"
          : "border-white/[0.06] bg-white/[0.015]"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <Label htmlFor={`${fieldId}-enabled`} className="text-sm">
            {meta.label}
          </Label>
          <p className="mt-0.5 truncate text-xs text-ash">{meta.description}</p>
        </div>
        <Switch
          id={`${fieldId}-enabled`}
          checked={config.enabled}
          disabled={disabled}
          onCheckedChange={(checked) => patch({ enabled: checked })}
        />
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-out",
          config.enabled
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
            <div>
              <Label htmlFor={`${fieldId}-channel`}>Log channel</Label>
              <div className="mt-1.5">
                <LogChannelSelect
                  id={`${fieldId}-channel`}
                  channels={channels}
                  value={config.channelId}
                  disabled={disabled}
                  onChange={(channelId) => patch({ channelId })}
                />
              </div>
              {channelError ? (
                <p className="mt-1.5 text-xs text-crimson-bright">
                  {channelError}
                </p>
              ) : null}
              {!channels && !channelError ? (
                <p className="mt-1.5 text-xs text-ash">
                  Couldn&apos;t load this server&apos;s channel list — enter
                  the channel ID directly.
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={`${fieldId}-embed`}>Post as embed</Label>
                <p className="mt-0.5 text-xs text-ash">
                  Off posts a plain text line instead.
                </p>
              </div>
              <Switch
                id={`${fieldId}-embed`}
                checked={config.embed}
                disabled={disabled}
                onCheckedChange={(checked) => patch({ embed: checked })}
              />
            </div>

            <div>
              <Label htmlFor={`${fieldId}-color`}>Embed color</Label>
              <div className="mt-1.5 max-w-xs">
                <ColorPicker
                  value={config.color}
                  disabled={disabled || !config.embed}
                  onChange={(color) => patch({ color })}
                />
              </div>
            </div>

            {meta.supportsIgnoreBots ? (
              <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
                <div>
                  <Label htmlFor={`${fieldId}-ignore-bots`}>Ignore bots</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    Skip logging this event when a bot account triggers it.
                  </p>
                </div>
                <Switch
                  id={`${fieldId}-ignore-bots`}
                  checked={config.ignoreBots}
                  disabled={disabled}
                  onCheckedChange={(checked) => patch({ ignoreBots: checked })}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
