"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { RolePicker } from "@/components/autorole/role-picker";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type {
  AutoroleConfig,
  AutoroleRole,
  CurrentAutoroleRole,
} from "@/types/autorole";

interface AutoroleEditorProps {
  guildId: string;
  initialConfig: AutoroleConfig;
  initialRoles: AutoroleRole[];
  canManageRoles: boolean;
  currentRole: CurrentAutoroleRole | null;
  unavailableReason: string | null;
}

export function AutoroleEditor({
  guildId,
  initialConfig,
  initialRoles,
  canManageRoles,
  currentRole,
  unavailableReason,
}: AutoroleEditorProps) {
  const { toast } = useToast();
  const initialEnabled = Boolean(initialConfig.autoroleId);
  const [savedEnabled, setSavedEnabled] = useState(initialEnabled);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [savedRoleId, setSavedRoleId] = useState(initialConfig.autoroleId);
  const [roleId, setRoleId] = useState(initialConfig.autoroleId);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldError, setServerFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = enabled !== savedEnabled || roleId !== savedRoleId;
  const roleIsUnavailable =
    enabled &&
    Boolean(roleId) &&
    roleId === currentRole?.id &&
    currentRole.assignable === false;
  const fieldError = useMemo(() => {
    if (!enabled) return null;
    if (!canManageRoles) return "CURSED needs the Manage Roles permission.";
    if (!roleId) return "Select one role before enabling autorole.";
    if (roleIsUnavailable) {
      return currentRole?.unavailableReason ?? "The configured role is unavailable.";
    }
    return serverFieldError;
  }, [canManageRoles, currentRole, enabled, roleId, roleIsUnavailable, serverFieldError]);
  const hasErrors = Boolean(fieldError);

  const reset = useCallback(() => {
    setEnabled(savedEnabled);
    setRoleId(savedRoleId);
    setServerError(null);
    setServerFieldError(null);
    setSuccess(null);
  }, [savedEnabled, savedRoleId]);

  const save = useCallback(async () => {
    if (hasErrors) {
      toast({
        title: "Autorole needs attention",
        description: fieldError ?? "Choose an assignable role.",
        variant: "error",
      });
      return;
    }

    setSaving(true);
    setServerError(null);
    setServerFieldError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/autorole`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoroleId: enabled ? roleId : null }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error ?? "Couldn't save autorole settings.";
        setServerError(message);
        setServerFieldError(data?.fieldErrors?.autoroleId?.[0] ?? null);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }

      const nextRoleId = (data.config as AutoroleConfig).autoroleId;
      const nextEnabled = Boolean(nextRoleId);
      setRoleId(nextRoleId);
      setSavedRoleId(nextRoleId);
      setEnabled(nextEnabled);
      setSavedEnabled(nextEnabled);
      setSuccess("Autorole settings are active in the live bot.");
      toast({
        title: "Autorole settings saved",
        description: "The live CURSED bot is using this configuration.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the dashboard API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [enabled, fieldError, guildId, hasErrors, roleId, toast]);

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={save}
        onReset={reset}
      />
      <ServerErrorBanner message={serverError} />

      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="max-w-3xl space-y-6">
        {!canManageRoles ? (
          <div className="flex items-start gap-2 rounded-lg border border-crimson/40 bg-crimson/[0.08] px-3 py-2.5 text-sm text-crimson-bright">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>CURSED needs Manage Roles before it can assign an autorole.</span>
          </div>
        ) : null}

        {unavailableReason && initialConfig.autoroleId ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/[0.08] px-3 py-2.5 text-sm text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{unavailableReason}</span>
          </div>
        ) : null}

        <DashboardCard title="Autorole" description="Assign one role whenever a new member joins.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="autorole-enabled">Enable autorole</Label>
              <p className="mt-0.5 text-xs text-ash">
                Turning this off stops role assignment without changing Discord roles.
              </p>
            </div>
            <Switch
              id="autorole-enabled"
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                setServerFieldError(null);
                setSuccess(null);
              }}
              disabled={saving}
            />
          </div>

          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <Label htmlFor="autorole-role">Role</Label>
            <div className="mt-1.5">
              <RolePicker
                roles={initialRoles}
                currentRole={currentRole}
                value={roleId}
                onChange={(value) => {
                  setRoleId(value);
                  setServerFieldError(null);
                  setSuccess(null);
                }}
                disabled={!enabled || saving || !canManageRoles}
              />
            </div>
            {fieldError ? (
              <p className="mt-1.5 text-xs text-crimson-bright">{fieldError}</p>
            ) : null}
          </div>
        </DashboardCard>

        <div className="flex justify-end">
          <EditorActions
            dirty={dirty}
            saving={saving}
            hasErrors={hasErrors}
            onSave={save}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
