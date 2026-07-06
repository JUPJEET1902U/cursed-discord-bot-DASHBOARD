"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RolePicker } from "@/components/autorole/role-picker";
import { useSettingsEditor } from "@/hooks/use-settings-editor";
import type { AutoroleConfig } from "@/types/autorole";
import type { DiscordRole } from "@/types/discord";

interface AutoroleEditorProps {
  guildId: string;
  initialConfig: AutoroleConfig;
  initialRoles: DiscordRole[] | null;
  initialBotHighestRolePosition: number | null;
}

interface FieldErrors {
  roleIds?: string;
}

function validate(config: AutoroleConfig): FieldErrors {
  const errors: FieldErrors = {};
  if (config.enabled && config.roleIds.length === 0) {
    errors.roleIds = "Select at least one role before enabling autorole.";
  }
  if (new Set(config.roleIds).size !== config.roleIds.length) {
    errors.roleIds = "Duplicate roles aren't allowed.";
  }
  return errors;
}

export function AutoroleEditor({
  guildId,
  initialConfig,
  initialRoles,
  initialBotHighestRolePosition,
}: AutoroleEditorProps) {
  const [roles] = useState<DiscordRole[] | null>(initialRoles);
  const [botHighestRolePosition] = useState<number | null>(
    initialBotHighestRolePosition
  );

  const {
    config,
    setConfig,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    handleSave,
    handleReset,
  } = useSettingsEditor({
    endpoint: `/api/guilds/${guildId}/autorole`,
    initialConfig,
    validate,
    successTitle: "Autorole settings saved",
    genericErrorMessage: "Couldn't save autorole settings.",
  });

  const warnedRoles = useMemo(() => {
    if (!roles || botHighestRolePosition === null) return [];
    const byId = new Map(roles.map((r) => [r.id, r]));
    return config.roleIds
      .map((id) => byId.get(id))
      .filter(
        (r): r is DiscordRole => Boolean(r) && r.position >= botHighestRolePosition
      );
  }, [roles, botHighestRolePosition, config.roleIds]);

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
          title="General"
          description="Turn autorole on for this server."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="autorole-enabled">Enable autorole</Label>
              <p className="mt-0.5 text-xs text-ash">
                When off, no roles are assigned when someone joins.
              </p>
            </div>
            <Switch
              id="autorole-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Roles"
          description="Roles automatically applied to new members."
        >
          <RolePicker
            roles={roles}
            botHighestRolePosition={botHighestRolePosition}
            selectedIds={config.roleIds}
            onChange={(roleIds) => setConfig((prev) => ({ ...prev, roleIds }))}
          />
          {errors.roleIds ? (
            <p className="mt-2 text-xs text-crimson-bright">{errors.roleIds}</p>
          ) : null}

          {warnedRoles.length > 0 ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-crimson/40 bg-crimson/[0.08] px-3 py-2.5 text-xs text-crimson-bright">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {warnedRoles.length === 1 ? "This role is" : "These roles are"}{" "}
                at or above the bot&apos;s highest role, so it currently
                can&apos;t assign{" "}
                {warnedRoles.length === 1 ? "it" : "them"}:{" "}
                <span className="font-medium">
                  {warnedRoles.map((r) => r.name).join(", ")}
                </span>
                . Move the bot&apos;s role higher in Server Settings → Roles
                to fix this.
              </span>
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
            <div>
              <Label htmlFor="autorole-require-all">Assign all selected roles</Label>
              <p className="mt-0.5 text-xs text-ash">
                On: every role above is applied. Off: the bot applies just one
                of them.
              </p>
            </div>
            <Switch
              id="autorole-require-all"
              checked={config.requireAll}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, requireAll: checked }))
              }
            />
          </div>
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
    </div>
  );
}
