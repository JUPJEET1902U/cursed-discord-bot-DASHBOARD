"use client";

import { useMemo, useState } from "react";
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

      <div className="max-w-3xl space-y-6">
        <DashboardCard
          title="Overview"
          description={`${enabledCount} of ${Object.keys(config).length} categories enabled.`}
        >
          <p className="text-xs text-ash">
            Turn on any event below and pick a channel for it. The bot reads
            this configuration on its own schedule — this dashboard never
            sends log messages itself.
          </p>
        </DashboardCard>

        {LOG_CATEGORY_GROUPS.map((group) => (
          <DashboardCard key={group.title} title={group.title}>
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
        ))}

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
