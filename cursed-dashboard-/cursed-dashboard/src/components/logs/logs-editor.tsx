"use client";

import { useMemo, useState } from "react";
import {
  MessageSquareText,
  PanelsTopLeft,
  Radio,
  ShieldCheck,
  Smile,
  Users,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { LogCategoryRow } from "@/components/logs/log-category-row";
import { useSettingsEditor } from "@/hooks/use-settings-editor";
import {
  LOG_CATEGORY_GROUPS,
  type LogCategoryKey,
  type LogsConfig,
} from "@/types/logs";
import type { DiscordChannel } from "@/types/discord";

interface LogsEditorProps {
  guildId: string;
  initialConfig: LogsConfig;
  initialChannels: DiscordChannel[] | null;
}

type FieldErrors = Partial<Record<LogCategoryKey, string>>;

const GROUP_ICONS = {
  Messages: MessageSquareText,
  Members: Users,
  Roles: ShieldCheck,
  Channels: PanelsTopLeft,
  Voice: Radio,
  Emoji: Smile,
} as const;

/** Client-side mirror of the server's per-category refinement: an enabled
 * category needs a channel selected before it can be saved. */
function validate(config: LogsConfig): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of Object.keys(config) as LogCategoryKey[]) {
    const category = config[key];
    if (category.enabled && !category.channelId) {
      errors[key] = "Choose a log channel before enabling this category.";
    }
  }
  return errors;
}

export function LogsEditor({
  guildId,
  initialConfig,
  initialChannels,
}: LogsEditorProps) {
  const [channels] = useState<DiscordChannel[] | null>(initialChannels);
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});

  const {
    config,
    setConfig,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    handleSave: saveConfig,
    handleReset: resetConfig,
  } = useSettingsEditor({
    endpoint: `/api/guilds/${guildId}/logs`,
    initialConfig,
    validate,
    successTitle: "Logging settings saved",
    genericErrorMessage: "Couldn't save logging settings.",
    invalidFieldsTitle: "Fix the highlighted categories",
    invalidFieldsDescription:
      "Some categories need a log channel before they can be enabled.",
  });

  const enabledCount = useMemo(
    () => Object.values(config).filter((c) => c.enabled).length,
    [config]
  );
  const totalCount = Object.keys(config).length;
  const progress = totalCount ? Math.round((enabledCount / totalCount) * 100) : 0;

  function patchCategory(key: LogCategoryKey, next: (typeof config)[typeof key]) {
    setConfig((prev) => ({ ...prev, [key]: next }));
    setServerFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  }

  async function handleSave() {
    setServerFieldErrors({});
    const { ok, data } = await saveConfig();
    if (!ok && data?.fieldErrors) {
      const flattened: FieldErrors = {};
      for (const [key, msgs] of Object.entries(
        data.fieldErrors as Record<string, unknown>
      )) {
        flattened[key as LogCategoryKey] = Array.isArray(msgs)
          ? msgs[0]
          : String(msgs);
      }
      setServerFieldErrors(flattened);
    }
  }

  function handleReset() {
    resetConfig();
    setServerFieldErrors({});
  }

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

      <div className="max-w-5xl space-y-6">
        <DashboardCard
          title="Logging overview"
          description="Choose which Discord events CURSED should route to log channels."
          icon={MessageSquareText}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
            <div>
              <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-fog">
                  {enabledCount} of {totalCount} categories active
                </span>
                <span className="text-ash">{progress}% configured</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-white/[0.06] bg-black/20">
                <div
                  className="h-full rounded-full bg-violet-bright transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ash">
                Each active category keeps the same saved channel, embed, color,
                and bot-filter settings. This refresh only changes how the controls
                are presented in the dashboard.
              </p>
            </div>

            <div className="rounded-xl border border-violet/20 bg-violet/[0.05] px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-bright">
                Delivery
              </p>
              <p className="mt-1 text-xs font-medium text-fog">Discord channels</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-ash">
                The dashboard stores settings; CURSED sends the actual log messages.
              </p>
            </div>
          </div>
        </DashboardCard>

        {LOG_CATEGORY_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.title as keyof typeof GROUP_ICONS] ?? MessageSquareText;
          const groupEnabled = group.categories.filter((meta) => config[meta.key].enabled).length;

          return (
            <DashboardCard
              key={group.title}
              title={group.title}
              description={`${groupEnabled} of ${group.categories.length} active`}
              icon={Icon}
            >
              <div className="space-y-3">
                {group.categories.map((meta) => (
                  <LogCategoryRow
                    key={meta.key}
                    meta={meta}
                    config={config[meta.key]}
                    channels={channels}
                    channelError={errors[meta.key] ?? serverFieldErrors[meta.key]}
                    disabled={saving}
                    onChange={(next) => patchCategory(meta.key, next)}
                  />
                ))}
              </div>
            </DashboardCard>
          );
        })}

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
    </div>
  );
}
