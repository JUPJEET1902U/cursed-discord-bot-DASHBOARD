"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BadgePlus,
  CheckCircle2,
  History,
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type {
  CustomRoleCatalogItem,
  CustomRoleCommandConfig,
  CustomRoleConfig,
  CustomRoleDashboardData,
  CustomRoleErrorResponse,
} from "@/types/custom-roles";

interface CustomRoleEditorProps {
  guildId: string;
  initialData: CustomRoleDashboardData;
}

const COMMAND_PATTERN = /^[a-z][a-z0-9-]{1,23}$/;
const NONE_VALUE = "__none__";

function cloneConfig(config: CustomRoleConfig): CustomRoleConfig {
  return JSON.parse(JSON.stringify(config)) as CustomRoleConfig;
}

function roleColor(color: number): string {
  return color === 0 ? "#8B8B96" : `#${color.toString(16).padStart(6, "0")}`;
}

function firstFieldError(
  errors: Record<string, string | string[]>,
  key: string
): string | null {
  const value = errors[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function RoleSelect({
  id,
  roles,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  roles: CustomRoleCatalogItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>No role selected</SelectItem>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: roleColor(role.color) }}
              />
              {role.name}
            </span>
          </SelectItem>
        ))}
        {roles.length === 0 ? (
          <div className="px-3 py-2 text-sm text-ash">No safe roles are available.</div>
        ) : null}
      </SelectContent>
    </Select>
  );
}

export function CustomRoleEditor({ guildId, initialData }: CustomRoleEditorProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(() => cloneConfig(initialData.config));
  const [form, setForm] = useState(() => cloneConfig(initialData.config));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const assignableRoles = useMemo(
    () => data.roles.filter((role) => role.assignable && !role.dangerous),
    [data.roles]
  );
  const requiredRoles = useMemo(
    () => data.roles.filter((role) => role.requiredEligible),
    [data.roles]
  );
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const localErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (form.enabled && !form.requiredRoleId) {
      errors.requiredRoleId = "Choose req.role before enabling custom role commands.";
    }
    const names = [...form.baseCommands, ...form.customCommands].map((entry) => entry.name);
    const duplicates = new Set(names.filter((name, index) => names.indexOf(name) !== index));
    for (const entry of form.customCommands) {
      if (!COMMAND_PATTERN.test(entry.name)) {
        errors[`commands.${entry.name || "unknown"}.name`] =
          "Use 2-24 lowercase letters, numbers, or hyphens, starting with a letter.";
      } else if (duplicates.has(entry.name)) {
        errors[`commands.${entry.name}.name`] = "Command names must be unique.";
      }
    }
    return errors;
  }, [form]);

  const combinedErrors = useMemo(
    () => ({ ...fieldErrors, ...localErrors }),
    [fieldErrors, localErrors]
  );
  const hasErrors = Object.keys(combinedErrors).length > 0;

  const reset = useCallback(() => {
    setForm(cloneConfig(saved));
    setFieldErrors({});
    setServerError(null);
    setSuccess(null);
  }, [saved]);

  const updateBase = useCallback(
    (name: string, patch: Partial<CustomRoleCommandConfig>) => {
      setForm((current) => ({
        ...current,
        baseCommands: current.baseCommands.map((entry) =>
          entry.name === name ? { ...entry, ...patch } : entry
        ),
      }));
      setFieldErrors({});
      setSuccess(null);
    },
    []
  );

  const updateCustom = useCallback(
    (index: number, patch: Partial<CustomRoleCommandConfig>) => {
      setForm((current) => ({
        ...current,
        customCommands: current.customCommands.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, ...patch } : entry
        ),
      }));
      setFieldErrors({});
      setSuccess(null);
    },
    []
  );

  const addCustomCommand = useCallback(() => {
    if (form.customCommands.length >= data.limits.customCommands) {
      toast({
        title: "Command limit reached",
        description: `Use no more than ${data.limits.customCommands} custom commands.`,
        variant: "error",
      });
      return;
    }
    let index = form.customCommands.length + 1;
    const used = new Set([
      ...form.baseCommands.map((entry) => entry.name),
      ...form.customCommands.map((entry) => entry.name),
    ]);
    while (used.has(`custom${index}`)) index += 1;
    setForm((current) => ({
      ...current,
      customCommands: [
        ...current.customCommands,
        { name: `custom${index}`, roleId: null, enabled: true, base: false },
      ],
    }));
    setSuccess(null);
  }, [data.limits.customCommands, form, toast]);

  const save = useCallback(async () => {
    if (hasErrors) {
      toast({
        title: "Custom roles need attention",
        description: "Fix the highlighted settings before saving.",
        variant: "error",
      });
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldErrors({});
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/custom-roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as
        | CustomRoleDashboardData
        | CustomRoleErrorResponse;
      if (!response.ok) {
        const error = payload as CustomRoleErrorResponse;
        setServerError(error.error ?? "Couldn't save custom role settings.");
        setFieldErrors(error.fieldErrors ?? {});
        toast({
          title: "Save failed",
          description: error.error ?? "The live bot rejected this configuration.",
          variant: "error",
        });
        return;
      }

      const next = payload as CustomRoleDashboardData;
      const nextConfig = cloneConfig(next.config);
      setData(next);
      setSaved(nextConfig);
      setForm(cloneConfig(nextConfig));
      setSuccess("Custom role commands are active in the live CURSED bot.");
      toast({
        title: "Custom roles saved",
        description: "The selected server is now using this req.role configuration.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the dashboard API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [form, guildId, hasErrors, toast]);

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

      <div className="space-y-6">
        <DashboardCard
          title="Feature access"
          description="Only the server owner, administrators, or members with req.role can use mapped role commands."
          icon={ShieldCheck}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="custom-role-enabled">Enable custom role commands</Label>
              <p className="mt-0.5 text-xs text-ash">
                Built-in CURSED commands always keep priority over custom mappings.
              </p>
            </div>
            <Switch
              id="custom-role-enabled"
              checked={form.enabled}
              onCheckedChange={(enabled) => {
                setForm((current) => ({ ...current, enabled }));
                setFieldErrors({});
                setSuccess(null);
              }}
              disabled={saving}
            />
          </div>

          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <Label htmlFor="required-role">Required Role (req.role)</Label>
            <p className="mb-2 mt-0.5 text-xs text-ash">
              Members need this role to assign or remove the approved output roles.
            </p>
            <RoleSelect
              id="required-role"
              roles={requiredRoles}
              value={form.requiredRoleId}
              onChange={(requiredRoleId) => {
                setForm((current) => ({ ...current, requiredRoleId }));
                setFieldErrors({});
                setSuccess(null);
              }}
              placeholder="Select req.role..."
              disabled={saving}
            />
            {firstFieldError(combinedErrors, "requiredRoleId") ? (
              <p className="mt-1.5 text-xs text-crimson-bright">
                {firstFieldError(combinedErrors, "requiredRoleId")}
              </p>
            ) : null}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Base role slots"
          description="Quick mappings for Staff, Girl, VIP, Guest, and Friend."
          icon={UsersRound}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {data.baseSlots.map((slot) => {
              const entry = form.baseCommands.find((item) => item.name === slot.name);
              if (!entry) return null;
              return (
                <div
                  key={slot.name}
                  className="rounded-xl border border-white/[0.08] bg-black/15 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-fog">{slot.label}</p>
                      <code className="text-xs text-ash">!{entry.name} @member</code>
                    </div>
                    <Switch
                      checked={entry.enabled}
                      onCheckedChange={(enabled) => updateBase(entry.name, { enabled })}
                      disabled={saving}
                    />
                  </div>
                  <RoleSelect
                    id={`base-role-${entry.name}`}
                    roles={assignableRoles}
                    value={entry.roleId}
                    onChange={(roleId) => updateBase(entry.name, { roleId })}
                    placeholder={`Select ${slot.label} role...`}
                    disabled={saving}
                  />
                  {firstFieldError(combinedErrors, `commands.${entry.name}.roleId`) ? (
                    <p className="mt-1.5 text-xs text-crimson-bright">
                      {firstFieldError(combinedErrors, `commands.${entry.name}.roleId`)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Additional commands"
          description={`Create up to ${data.limits.customCommands} extra role shortcuts.`}
          icon={BadgePlus}
        >
          <div className="mb-4 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={addCustomCommand}
              disabled={saving || form.customCommands.length >= data.limits.customCommands}
            >
              <Plus className="h-4 w-4" />
              Add command
            </Button>
          </div>

          <div className="space-y-4">
            {form.customCommands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.1] p-8 text-center text-sm text-ash">
                No additional mappings yet. The five base slots are ready to use.
              </div>
            ) : null}

            {form.customCommands.map((entry, index) => (
              <div
                key={`${entry.name}-${index}`}
                className="grid gap-4 rounded-xl border border-white/[0.08] bg-black/15 p-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
              >
                <div>
                  <Label htmlFor={`custom-name-${index}`}>Command name</Label>
                  <Input
                    id={`custom-name-${index}`}
                    className="mt-1.5"
                    value={entry.name}
                    maxLength={24}
                    onChange={(event) =>
                      updateCustom(index, {
                        name: event.target.value
                          .toLowerCase()
                          .replace(/^[!/.]+/, "")
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-ash">
                    Preview: !{entry.name || "command"} @member
                  </p>
                  {firstFieldError(combinedErrors, `commands.${entry.name || "unknown"}.name`) ? (
                    <p className="mt-1 text-xs text-crimson-bright">
                      {firstFieldError(
                        combinedErrors,
                        `commands.${entry.name || "unknown"}.name`
                      )}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor={`custom-role-${index}`}>Output role</Label>
                  <div className="mt-1.5">
                    <RoleSelect
                      id={`custom-role-${index}`}
                      roles={assignableRoles}
                      value={entry.roleId}
                      onChange={(roleId) => updateCustom(index, { roleId })}
                      placeholder="Select an output role..."
                      disabled={saving}
                    />
                  </div>
                  {firstFieldError(combinedErrors, `commands.${entry.name}.roleId`) ? (
                    <p className="mt-1 text-xs text-crimson-bright">
                      {firstFieldError(combinedErrors, `commands.${entry.name}.roleId`)}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={entry.enabled}
                    onCheckedChange={(enabled) => updateCustom(index, { enabled })}
                    disabled={saving}
                  />
                  <span className="text-sm text-ash">Enabled</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      customCommands: current.customCommands.filter(
                        (_, commandIndex) => commandIndex !== index
                      ),
                    }))
                  }
                  disabled={saving}
                  aria-label={`Remove ${entry.name}`}
                  className="text-crimson-bright hover:text-crimson-bright"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Safety rules"
          description="The live bot rechecks every change before Discord receives it."
          icon={ShieldAlert}
        >
          <div className="grid gap-2 text-sm text-ash md:grid-cols-2">
            <p>✓ CURSED must have Manage Roles.</p>
            <p>✓ Output roles must stay below CURSED.</p>
            <p>✓ Administrator and Manage Roles roles are blocked.</p>
            <p>✓ Managed roles and @everyone are blocked.</p>
            <p>✓ Built-in CURSED command names cannot be replaced.</p>
            <p>✓ Actor and target hierarchy is enforced.</p>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Discord recovery commands"
          description="Use these owner/admin commands if the dashboard is temporarily unavailable."
          icon={KeyRound}
        >
          <div className="grid gap-2 text-sm font-mono text-ash sm:grid-cols-2">
            <code>!reqrole set @role</code>
            <code>!reqrole clear</code>
            <code>!rolecmd add staff @role</code>
            <code>!rolecmd remove staff</code>
            <code>!rolecmd enable</code>
            <code>!rolecommands</code>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Recent activity"
          description="Custom-role configuration and usage records are retained for up to 90 days."
          icon={History}
        >
          <div className="space-y-2">
            {data.audits.length === 0 ? (
              <p className="text-sm text-ash">No custom-role activity has been recorded yet.</p>
            ) : null}
            {data.audits.slice(0, 12).map((audit, index) => (
              <div
                key={`${audit.createdAt}-${index}`}
                className="flex flex-col justify-between gap-1 rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5 text-sm sm:flex-row sm:items-center"
              >
                <span className="text-fog">
                  <strong className="capitalize">{audit.action}</strong>
                  {audit.commandName ? ` via !${audit.commandName}` : " settings"}
                  {!audit.success ? " — denied or failed" : ""}
                </span>
                <time className="text-xs text-ash">
                  {new Date(audit.createdAt).toLocaleString()}
                </time>
              </div>
            ))}
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
