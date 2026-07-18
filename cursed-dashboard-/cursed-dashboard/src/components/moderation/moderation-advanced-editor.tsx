"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileSearch,
  ListChecks,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRoundCheck,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  advancedCaseOperationSchema,
  advancedModerationConfigSchema,
} from "@/lib/validation/moderation-advanced";
import type {
  AdvancedCaseOperation,
  AdvancedCommandToggles,
  AdvancedModerationConfig,
  AdvancedModerationData,
} from "@/types/moderation-advanced";

interface Props {
  guildId: string;
  initialData: AdvancedModerationData;
}

const selectClass =
  "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:opacity-50";

const commandLabels: Array<[keyof AdvancedCommandToggles, string, string]> = [
  ["purge", "Purge", "Filtered deletion with a configurable maximum."],
  ["lock", "Lock", "Lock a channel and save its previous permissions."],
  ["unlock", "Unlock", "Restore the exact saved channel permissions."],
  ["slowmode", "Slowmode", "Set or disable channel slowmode."],
  ["nickname", "Nickname", "Set or reset member nicknames."],
  ["tempban", "Temporary ban", "Restart-safe bans with automatic expiry."],
  ["softban", "Softban", "Remove recent messages while allowing rejoin."],
  ["note", "Moderator note", "Add private notes to case history."],
  ["history", "History", "View a member's recent moderation cases."],
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseIds(value: string): string[] {
  return [...new Set(value.split(/[\s,\n]+/).map((item) => item.trim()).filter(Boolean))];
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-0">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-ash">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function StatusBadge({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        ready
          ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200"
          : "border-amber-400/30 bg-amber-400/[0.06] text-amber-200"
      }`}
    >
      {ready ? "✓" : "!"} {label}
    </div>
  );
}

export function ModerationAdvancedEditor({ guildId, initialData }: Props) {
  const { toast } = useToast();
  const [config, setConfig] = useState<AdvancedModerationConfig>(() => clone(initialData.config));
  const [saved, setSaved] = useState<AdvancedModerationConfig>(() => clone(initialData.config));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState("");
  const [caseNote, setCaseNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [caseBusy, setCaseBusy] = useState(false);

  const validation = useMemo(() => advancedModerationConfigSchema.safeParse(config), [config]);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const validationError = validation.success
    ? null
    : validation.error.issues[0]?.message ?? "Advanced moderation settings are invalid.";

  function patch(value: Partial<AdvancedModerationConfig>) {
    setConfig((current) => ({ ...current, ...value }));
    setSuccess(null);
  }

  function patchLogging(value: Partial<AdvancedModerationConfig["logging"]>) {
    setConfig((current) => ({ ...current, logging: { ...current.logging, ...value } }));
    setSuccess(null);
  }

  function patchWhitelist(value: Partial<AdvancedModerationConfig["whitelist"]>) {
    setConfig((current) => ({ ...current, whitelist: { ...current.whitelist, ...value } }));
    setSuccess(null);
  }

  function toggleCommand(key: keyof AdvancedCommandToggles) {
    setConfig((current) => ({
      ...current,
      commandToggles: { ...current.commandToggles, [key]: !current.commandToggles[key] },
    }));
  }

  function toggleListValue(kind: "roleIds" | "channelIds", id: string) {
    const current = config.whitelist[kind];
    patchWhitelist({
      [kind]: current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    });
  }

  function reset() {
    setConfig(clone(saved));
    setError(null);
    setSuccess(null);
  }

  async function save() {
    const parsed = advancedModerationConfigSchema.safeParse(config);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Advanced moderation settings are invalid.";
      setError(message);
      toast({ title: "Validation failed", description: message, variant: "error" });
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/moderation/advanced`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.error ?? "Could not save advanced moderation settings.";
        setError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }
      const next = clone(data.config as AdvancedModerationConfig);
      setConfig(next);
      setSaved(next);
      setSuccess("Advanced moderation and whitelist settings were saved.");
      toast({
        title: "Advanced moderation saved",
        description: "CURSED will use these settings after the normal config refresh.",
        variant: "success",
      });
    } catch {
      setError("Network error while saving advanced moderation settings.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCase(operation: AdvancedCaseOperation) {
    const number = Number(caseNumber);
    if (!Number.isInteger(number) || number < 1) {
      setError("Enter a valid positive case number.");
      return;
    }
    const parsed = advancedCaseOperationSchema.safeParse(operation);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Case operation is invalid.");
      return;
    }

    setCaseBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/guilds/${guildId}/moderation/advanced/cases/${number}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.error ?? "Could not update the case.";
        setError(message);
        toast({ title: "Case update failed", description: message, variant: "error" });
        return;
      }
      if (operation.operation === "note") setCaseNote("");
      toast({
        title: "Case updated",
        description:
          operation.operation === "note"
            ? `A private note was added to case #${number}.`
            : `Evidence was updated for case #${number}.`,
        variant: "success",
      });
    } catch {
      setError("Network error while updating the case.");
    } finally {
      setCaseBusy(false);
    }
  }

  const permissions = initialData.botPermissions;
  const statusCards = [
    ["Pending tasks", initialData.pendingTasks.available ? initialData.pendingTasks.total : "—", Clock3],
    ["Temporary bans", initialData.pendingTasks.available ? initialData.pendingTasks.tempbans : "—", LockKeyhole],
    ["Locked channels", initialData.lockedChannelIds.length, LockKeyhole],
    ["Failed tasks", initialData.pendingTasks.available ? initialData.pendingTasks.failed : "—", FileSearch],
  ] as const;

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={!validation.success}
        onSave={save}
        onReset={reset}
      />
      <ServerErrorBanner message={error ?? validationError} />
      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statusCards.map(([label, value, Icon]) => (
          <div key={label} className="glass rounded-xl p-4">
            <Icon className="mb-2 h-4 w-4 text-violet-bright" />
            <p className="text-[11px] uppercase tracking-wide text-ash">{label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-fog">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <DashboardCard
          title="Advanced moderation"
          description="Daily staff tools are isolated from existing CURSED features and can be disabled individually."
          action={<ShieldCheck className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Toggle id="advanced-enabled" label="Enable Phase 2 moderation" description="Master switch for the new advanced moderation commands." checked={config.advancedModerationEnabled} onChange={(value) => patch({ advancedModerationEnabled: value })} />
              <Toggle id="tempban-enabled" label="Enable temporary bans" description="Automatic unbans are persisted in MongoDB and survive restarts." checked={config.tempBansEnabled} onChange={(value) => patch({ tempBansEnabled: value })} />
              <Toggle id="softban-enabled" label="Enable softbans" description="Ban and immediately unban to clear recent messages." checked={config.softbansEnabled} onChange={(value) => patch({ softbansEnabled: value })} />
              <Toggle id="notes-enabled" label="Enable private moderator notes" description="Store internal notes as persistent moderation cases." checked={config.moderatorNotesEnabled} onChange={(value) => patch({ moderatorNotesEnabled: value })} />
              <Toggle id="dangerous-admin-only" label="Dangerous commands require Administrator" description="Restricts purge, lock, unlock, tempban, and softban." checked={config.dangerousCommandsAdminOnly} onChange={(value) => patch({ dangerousCommandsAdminOnly: value })} />
            </div>
            <div>
              <Label htmlFor="max-purge">Maximum purge amount</Label>
              <Input id="max-purge" className="mt-1.5" type="number" min={1} max={100} value={config.maxPurgeAmount} onChange={(event) => patch({ maxPurgeAmount: Number(event.target.value) })} />
              <p className="mt-2 text-xs text-ash">Discord bulk deletion is capped at 100 recent messages.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <StatusBadge label="Manage Messages" ready={permissions.manageMessages} />
                <StatusBadge label="Manage Channels" ready={permissions.manageChannels} />
                <StatusBadge label="Manage Nicknames" ready={permissions.manageNicknames} />
                <StatusBadge label="Ban Members" ready={permissions.banMembers} />
                <StatusBadge label="Moderate Members" ready={permissions.moderateMembers} />
                <StatusBadge label="MongoDB connected" ready={initialData.mongoConnected} />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Command controls" description="Enable only the advanced tools your staff should use." action={<ListChecks className="h-5 w-5 text-violet-bright" />}>
          <div className="grid gap-x-6 lg:grid-cols-2">
            {commandLabels.map(([key, label, description]) => (
              <Toggle key={key} id={`command-${key}`} label={`/${label.toLowerCase().replace(" ", "")}`} description={description} checked={config.commandToggles[key]} onChange={() => toggleCommand(key)} />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Trusted whitelist" description="Whitelist users, roles, channels, and bots from AutoMod and optional manual moderation protection." action={<UserRoundCheck className="h-5 w-5 text-violet-bright" />}>
          <Toggle id="whitelist-enabled" label="Enable moderation whitelist" description="Whitelist entries do nothing until this is enabled." checked={config.whitelist.enabled} onChange={(value) => patchWhitelist({ enabled: value })} />
          <Toggle id="whitelist-automod" label="Exempt trusted entries from AutoMod" description="Trusted members, roles, channels, and bots bypass anti-spam, anti-link, and anti-invite." checked={config.whitelist.exemptFromAutomod} onChange={(value) => patchWhitelist({ exemptFromAutomod: value })} />
          <Toggle id="whitelist-manual" label="Protect trusted targets from manual punishments" description="Only the server owner can override this protection." checked={config.whitelist.protectFromManualModeration} onChange={(value) => patchWhitelist({ protectFromManualModeration: value })} />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="trusted-users">Trusted user IDs</Label>
                <Textarea id="trusted-users" className="mt-1.5" rows={4} value={config.whitelist.userIds.join("\n")} onChange={(event) => patchWhitelist({ userIds: parseIds(event.target.value) })} placeholder="One Discord user ID per line" />
              </div>
              <div>
                <Label htmlFor="trusted-bots">Trusted bot IDs</Label>
                <Textarea id="trusted-bots" className="mt-1.5" rows={4} value={config.whitelist.botIds.join("\n")} onChange={(event) => patchWhitelist({ botIds: parseIds(event.target.value) })} placeholder="One Discord bot ID per line" />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <Label>Trusted roles</Label>
                <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                  {initialData.roles.map((role) => (
                    <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-fog">
                      <input type="checkbox" checked={config.whitelist.roleIds.includes(role.id)} onChange={() => toggleListValue("roleIds", role.id)} className="h-4 w-4 accent-violet" />
                      <span className="truncate">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Trusted channels</Label>
                <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                  {initialData.channels.map((channel) => (
                    <label key={channel.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-fog">
                      <input type="checkbox" checked={config.whitelist.channelIds.includes(channel.id)} onChange={() => toggleListValue("channelIds", channel.id)} className="h-4 w-4 accent-violet" />
                      <span className="truncate">#{channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Detailed logging" description="Privacy-aware message and member change logs.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Toggle id="delete-logs" label="Deleted message logs" description="Log message metadata and optionally content." checked={config.logging.messageDeleteEnabled} onChange={(value) => patchLogging({ messageDeleteEnabled: value })} />
              <Toggle id="edit-logs" label="Edited message logs" description="Log before and after content with a jump link." checked={config.logging.messageEditEnabled} onChange={(value) => patchLogging({ messageEditEnabled: value })} />
              <Toggle id="member-logs" label="Member update logs" description="Log nickname and role changes." checked={config.logging.memberUpdateEnabled} onChange={(value) => patchLogging({ memberUpdateEnabled: value })} />
              <Toggle id="deleted-content" label="Store deleted message content" description="Leave disabled for stronger privacy." checked={config.logging.storeDeletedMessageContent} onChange={(value) => patchLogging({ storeDeletedMessageContent: value })} />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message-log-channel">Message log channel</Label>
                <select id="message-log-channel" className={`${selectClass} mt-1.5`} value={config.logging.messageLogChannelId ?? "none"} onChange={(event) => patchLogging({ messageLogChannelId: event.target.value === "none" ? null : event.target.value })}>
                  <option value="none">No message log channel</option>
                  {initialData.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="member-log-channel">Member log channel</Label>
                <select id="member-log-channel" className={`${selectClass} mt-1.5`} value={config.logging.memberLogChannelId ?? "none"} onChange={(event) => patchLogging({ memberLogChannelId: event.target.value === "none" ? null : event.target.value })}>
                  <option value="none">No member log channel</option>
                  {initialData.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Case notes and evidence" description="Add private context or evidence to an existing MongoDB case." action={<FileSearch className="h-5 w-5 text-violet-bright" />}>
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div>
              <Label htmlFor="case-number">Case number</Label>
              <Input id="case-number" className="mt-1.5" type="number" min={1} value={caseNumber} onChange={(event) => setCaseNumber(event.target.value)} placeholder="Example: 24" />
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="case-note">Private moderator note</Label>
                <Textarea id="case-note" className="mt-1.5" rows={3} maxLength={2000} value={caseNote} onChange={(event) => setCaseNote(event.target.value)} placeholder="Internal staff context" />
                <div className="mt-2 flex justify-end">
                  <Button type="button" variant="outline" disabled={caseBusy || !caseNote.trim()} onClick={() => updateCase({ operation: "note", note: caseNote.trim() })}>
                    {caseBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Add private note
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="evidence-url">Evidence URL</Label>
                <Input id="evidence-url" className="mt-1.5" type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://..." />
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" disabled={caseBusy} onClick={() => updateCase({ operation: "evidence", evidenceUrl: null })}>Clear evidence</Button>
                  <Button type="button" variant="outline" disabled={caseBusy || !evidenceUrl.trim()} onClick={() => updateCase({ operation: "evidence", evidenceUrl: evidenceUrl.trim() })}>
                    <FileSearch className="h-4 w-4" /> Save evidence
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <div className="flex justify-end">
          <EditorActions dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} />
        </div>
      </div>
    </div>
  );
}
