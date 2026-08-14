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

function categoryAccent(key: LogCategoryMeta["key"]) {
  if (key.startsWith("message")) {
    return {
      dot: "bg-violet-bright",
      active: "border-violet/30 bg-violet/[0.045]",
      badge: "border-violet/20 bg-violet/[0.08] text-violet-bright",
    };
  }
  if (key.startsWith("member")) {
    return {
      dot: "bg-sky-400",
      active: "border-sky-400/25 bg-sky-400/[0.035]",
      badge: "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",
    };
  }
  if (key.startsWith("role")) {
    return {
      dot: "bg-amber-400",
      active: "border-amber-400/25 bg-amber-400/[0.035]",
      badge: "border-amber-400/20 bg-amber-400/[0.07] text-amber-300",
    };
  }
  if (key.startsWith("channel")) {
    return {
      dot: "bg-cyan-400",
      active: "border-cyan-400/25 bg-cyan-400/[0.035]",
      badge: "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300",
    };
  }
  if (key.startsWith("voice")) {
    return {
      dot: "bg-emerald-400",
      active: "border-emerald-400/25 bg-emerald-400/[0.035]",
      badge: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
    };
  }
  if (key === "moderationAction") {
    return {
      dot: "bg-rose-400",
      active: "border-rose-400/25 bg-rose-400/[0.035]",
      badge: "border-rose-400/20 bg-rose-400/[0.07] text-rose-300",
    };
  }
  if (key === "securityAlert") {
    return {
      dot: "bg-amber-300",
      active: "border-amber-300/25 bg-amber-300/[0.035]",
      badge: "border-amber-300/20 bg-amber-300/[0.07] text-amber-200",
    };
  }
  if (key === "ticketEvent") {
    return {
      dot: "bg-blue-400",
      active: "border-blue-400/25 bg-blue-400/[0.035]",
      badge: "border-blue-400/20 bg-blue-400/[0.07] text-blue-300",
    };
  }
  return {
    dot: "bg-pink-400",
    active: "border-pink-400/25 bg-pink-400/[0.035]",
    badge: "border-pink-400/20 bg-pink-400/[0.07] text-pink-300",
  };
}

export function LogCategoryRow({
  meta,
  config,
  channels,
  channelError,
  onChange,
  disabled,
}: LogCategoryRowProps) {
  const fieldId = `log-${meta.key}`;
  const accent = categoryAccent(meta.key);
  const supportsFormatting = meta.supportsFormatting !== false;

  function patch(partial: Partial<LogCategoryConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-200",
        config.enabled
          ? accent.active
          : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.10]"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]", accent.dot)} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={`${fieldId}-enabled`} className="text-sm font-semibold text-fog">
                {meta.label}
              </Label>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]",
                  config.enabled
                    ? accent.badge
                    : "border-white/[0.07] bg-white/[0.025] text-ash"
                )}
              >
                {config.enabled ? "Active" : "Off"}
              </span>
              {config.enabled && supportsFormatting ? (
                <span className="rounded-full border border-white/[0.07] bg-black/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-ash">
                  {config.embed ? "Embed" : "Plain text"}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ash">{meta.description}</p>
          </div>
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
          config.enabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="space-y-4 border-t border-white/[0.06] bg-black/[0.06] px-4 py-4">
            <div
              className={cn(
                "grid gap-4",
                supportsFormatting && "md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]"
              )}
            >
              <div>
                <Label htmlFor={`${fieldId}-channel`}>Log channel</Label>
                <p className="mt-0.5 text-xs text-ash">Where CURSED sends this event.</p>
                <div className="mt-2">
                  <LogChannelSelect
                    id={`${fieldId}-channel`}
                    channels={channels}
                    value={config.channelId}
                    disabled={disabled}
                    onChange={(channelId) => patch({ channelId })}
                  />
                </div>
                {channelError ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">{channelError}</p>
                ) : null}
              </div>

              {supportsFormatting ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor={`${fieldId}-embed`}>Post as embed</Label>
                      <p className="mt-0.5 text-xs text-ash">Use the richer CURSED Discord card layout.</p>
                    </div>
                    <Switch
                      id={`${fieldId}-embed`}
                      checked={config.embed}
                      disabled={disabled}
                      onCheckedChange={(checked) => patch({ embed: checked })}
                    />
                  </div>

                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor={`${fieldId}-color`}>Embed accent</Label>
                        <p className="mt-0.5 text-xs text-ash">Discord side-bar color.</p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 rounded-full border border-white/15 shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                        style={{ backgroundColor: config.color }}
                      />
                    </div>
                    <div className="mt-2">
                      <ColorPicker
                        value={config.color}
                        disabled={disabled || !config.embed}
                        onChange={(color) => patch({ color })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-ash">
                  This CURSED subsystem keeps its branded embed format. This page controls whether it logs and which channel receives it.
                </div>
              )}
            </div>

            {meta.supportsDeletedContent ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.025] px-3.5 py-3">
                <div>
                  <Label htmlFor={`${fieldId}-content`}>Include deleted message content</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    When off, CURSED logs only the author, channel, message ID, and attachments.
                  </p>
                </div>
                <Switch
                  id={`${fieldId}-content`}
                  checked={config.includeContent}
                  disabled={disabled}
                  onCheckedChange={(checked) => patch({ includeContent: checked })}
                />
              </div>
            ) : null}

            {meta.supportsIgnoreBots ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-3.5 py-3">
                <div>
                  <Label htmlFor={`${fieldId}-ignore-bots`}>Ignore bots</Label>
                  <p className="mt-0.5 text-xs text-ash">Skip this event when the subject is a bot account.</p>
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
