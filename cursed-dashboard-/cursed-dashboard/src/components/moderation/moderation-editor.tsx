"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Gavel,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
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
import { moderationConfigSchema } from "@/lib/validation/moderation";
import type {
  ModerationBotPermissions,
  ModerationCase,
  ModerationCaseOperation,
  ModerationConfig,
  ModerationData,
  ModerationStats,
  WarningEscalationAction,
  WarningThreshold,
} from "@/types/moderation";

interface ModerationEditorProps {
  guildId: string;
  initialData: ModerationData;
}

const selectClass =
  "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none transition-colors focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeDomain(value: string): string {
  return (value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0] ?? "").trim();
}

function normalizeConfig(config: ModerationConfig): ModerationConfig {
  return {
    ...config,
    moderatorRoleIds: [...new Set(config.moderatorRoleIds.map(String))],
    linkWhitelist: [
      ...new Set(config.linkWhitelist.map(normalizeDomain).filter(Boolean)),
    ],
    warningThresholds: [...config.warningThresholds]
      .map((threshold) => ({
        warnings: Number(threshold.warnings),
        action: threshold.action,
        durationMinutes:
          threshold.action === "timeout"
            ? Number(threshold.durationMinutes ?? 60)
            : null,
      }))
      .sort((left, right) => left.warnings - right.warnings),
  };
}

function ToggleRow({
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
  onChange: (checked: boolean) => void;
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

function PermissionBadge({ label, ready }: { label: string; ready: boolean }) {
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

function formatDate(value: string | null): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(durationMs: number | null): string | null {
  if (!durationMs) return null;
  const minutes = Math.round(durationMs / 60_000);
  if (minutes % 1440 === 0) return `${minutes / 1440} day(s)`;
  if (minutes % 60 === 0) return `${minutes / 60} hour(s)`;
  return `${minutes} minute(s)`;
}

function actionIcon(action: string) {
  if (action.includes("BAN")) return Ban;
  if (action.includes("TIMEOUT") || action.includes("MUTE")) return Clock3;
  if (action.includes("WARN")) return AlertTriangle;
  return Gavel;
}

function CaseCard({
  record,
  selected,
  onSelect,
}: {
  record: ModerationCase;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = actionIcon(record.action);
  const duration = formatDuration(record.durationMs);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-violet/60 bg-violet/[0.08]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className="flex gap-3">
        <div className="h-fit rounded-lg bg-violet/15 p-2 text-violet-bright">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold text-fog">
              Case #{record.caseNumber}
            </span>
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ash">
              {record.action.replaceAll("_", " ")}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                record.status === "active"
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-white/[0.06] text-ash"
              }`}
            >
              {record.status}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-ash">
            {record.targetTag} · {record.targetId}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-fog/90">{record.reason}</p>
          <p className="mt-2 text-[11px] text-ash">
            {formatDate(record.createdAt)}
            {duration ? ` · ${duration}` : ""}
            {` · ${record.source}`}
          </p>
        </div>
      </div>
    </button>
  );
}

function CaseInspector({
  record,
  busy,
  onUpdate,
  onClose,
}: {
  record: ModerationCase;
  busy: boolean;
  onUpdate: (operation: ModerationCaseOperation) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(record.reason);
  const [revokeReason, setRevokeReason] = useState("");

  useEffect(() => {
    setReason(record.reason);
    setRevokeReason("");
  }, [record]);

  return (
    <div className="rounded-xl border border-violet/30 bg-violet/[0.05] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display font-semibold text-fog">Case #{record.caseNumber}</h4>
          <p className="mt-0.5 text-xs text-ash">
            {record.action.replaceAll("_", " ")} · {record.status} · {record.source}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-ash">Target</p>
          <p className="mt-1 break-all text-fog">
            {record.targetTag} · {record.targetId}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-ash">Moderator</p>
          <p className="mt-1 break-all text-fog">{record.moderatorTag}</p>
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor={`case-reason-${record.caseNumber}`}>Case reason</Label>
        <Textarea
          id={`case-reason-${record.caseNumber}`}
          className="mt-1.5"
          value={reason}
          maxLength={2000}
          rows={4}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !reason.trim() || reason.trim() === record.reason}
            onClick={() => onUpdate({ operation: "reason", reason: reason.trim() })}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FilePenLine className="h-4 w-4" />
            )}
            Update reason
          </Button>
        </div>
      </div>

      {record.status === "active" ? (
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <Label htmlFor={`case-revoke-${record.caseNumber}`}>Revocation note</Label>
          <Input
            id={`case-revoke-${record.caseNumber}`}
            className="mt-1.5"
            value={revokeReason}
            maxLength={1000}
            placeholder="Optional explanation"
            onChange={(event) => setRevokeReason(event.target.value)}
          />
          <p className="mt-1 text-xs text-ash">
            Revoking a case changes the record only. It does not undo the Discord punishment.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                onUpdate({
                  operation: "revoke",
                  reason: revokeReason.trim() || null,
                })
              }
            >
              <ShieldAlert className="h-4 w-4" />
              Revoke case
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onUpdate({ operation: "delete" })}
              className="text-crimson-bright hover:text-crimson-bright"
            >
              <Trash2 className="h-4 w-4" />
              Hide case
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ModerationEditor({ guildId, initialData }: ModerationEditorProps) {
  const { toast } = useToast();
  const initialConfig = useMemo(
    () => normalizeConfig(initialData.config),
    [initialData.config]
  );
  const [config, setConfig] = useState(() => clone(initialConfig));
  const [savedConfig, setSavedConfig] = useState(() => clone(initialConfig));
  const [permissions, setPermissions] = useState<ModerationBotPermissions>(
    initialData.botPermissions
  );
  const [stats, setStats] = useState<ModerationStats>(initialData.stats);
  const [cases, setCases] = useState<ModerationCase[]>(initialData.cases);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [caseBusy, setCaseBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [domainDraft, setDomainDraft] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [caseAction, setCaseAction] = useState("all");

  const normalized = useMemo(() => normalizeConfig(config), [config]);
  const validation = useMemo(
    () => moderationConfigSchema.safeParse(normalized),
    [normalized]
  );
  const dirty = JSON.stringify(normalized) !== JSON.stringify(savedConfig);
  const hasErrors = !validation.success;
  const validationMessage = validation.success
    ? null
    : validation.error.issues[0]?.message ?? "Some moderation settings are invalid.";

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patchConfig = useCallback((patch: Partial<ModerationConfig>) => {
    setConfig((previous) => ({ ...previous, ...patch }));
    setServerError(null);
    setSuccess(null);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(clone(savedConfig));
    setServerError(null);
    setSuccess(null);
  }, [savedConfig]);

  const handleSave = useCallback(async () => {
    const parsed = moderationConfigSchema.safeParse(normalized);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Some settings are invalid.";
      setServerError(message);
      toast({ title: "Fix moderation settings", description: message, variant: "error" });
      return;
    }

    setSaving(true);
    setServerError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/moderation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldMessage = Object.values(data?.fieldErrors ?? {})
          .flat()
          .find((value): value is string => typeof value === "string");
        const message = fieldMessage ?? data?.error ?? "Couldn't save moderation settings.";
        setServerError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }
      const next = normalizeConfig(data.config);
      setConfig(clone(next));
      setSavedConfig(clone(next));
      if (data.botPermissions) setPermissions(data.botPermissions);
      setSuccess("The live Railway bot is now using these moderation settings.");
      toast({
        title: "Moderation settings saved",
        description: "Changes are active in CURSED.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the moderation API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [guildId, normalized, toast]);

  const toggleRole = useCallback(
    (roleId: string) => {
      patchConfig({
        moderatorRoleIds: config.moderatorRoleIds.includes(roleId)
          ? config.moderatorRoleIds.filter((id) => id !== roleId)
          : [...config.moderatorRoleIds, roleId],
      });
    },
    [config.moderatorRoleIds, patchConfig]
  );

  const addDomain = useCallback(() => {
    const domain = normalizeDomain(domainDraft);
    if (!domain) return;
    patchConfig({ linkWhitelist: [...new Set([...config.linkWhitelist, domain])] });
    setDomainDraft("");
  }, [config.linkWhitelist, domainDraft, patchConfig]);

  const patchThreshold = useCallback(
    (index: number, patch: Partial<WarningThreshold>) => {
      patchConfig({
        warningThresholds: config.warningThresholds.map((threshold, thresholdIndex) =>
          thresholdIndex === index ? { ...threshold, ...patch } : threshold
        ),
      });
    },
    [config.warningThresholds, patchConfig]
  );

  const addThreshold = useCallback(() => {
    const highest = config.warningThresholds.reduce(
      (value, threshold) => Math.max(value, threshold.warnings),
      0
    );
    patchConfig({
      warningThresholds: [
        ...config.warningThresholds,
        { warnings: Math.min(100, highest + 1), action: "timeout", durationMinutes: 60 },
      ],
    });
  }, [config.warningThresholds, patchConfig]);

  const removeThreshold = useCallback(
    (index: number) => {
      patchConfig({
        warningThresholds: config.warningThresholds.filter(
          (_threshold, thresholdIndex) => thresholdIndex !== index
        ),
      });
    },
    [config.warningThresholds, patchConfig]
  );

  const updateCase = useCallback(
    async (caseNumber: number, operation: ModerationCaseOperation) => {
      setCaseBusy(true);
      setServerError(null);
      try {
        const response = await fetch(
          `/api/guilds/${guildId}/moderation/cases/${caseNumber}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operation),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          const message = data?.error ?? "Couldn't update that moderation case.";
          setServerError(message);
          toast({ title: "Case update failed", description: message, variant: "error" });
          return;
        }
        if (operation.operation === "delete") {
          setCases((previous) =>
            previous.filter((record) => record.caseNumber !== caseNumber)
          );
          setSelectedCaseNumber(null);
        } else {
          setCases((previous) =>
            previous.map((record) =>
              record.caseNumber === caseNumber ? data.case : record
            )
          );
        }
        if (data.stats) setStats(data.stats);
        toast({
          title: "Moderation case updated",
          description: `Case #${caseNumber} was updated.`,
          variant: "success",
        });
      } catch {
        const message = "Network error - couldn't update that case.";
        setServerError(message);
        toast({ title: "Case update failed", description: message, variant: "error" });
      } finally {
        setCaseBusy(false);
      }
    },
    [guildId, toast]
  );

  const filteredCases = useMemo(() => {
    const query = caseSearch.trim().toLowerCase();
    return cases.filter((record) => {
      if (caseAction !== "all" && record.action !== caseAction) return false;
      if (!query) return true;
      return [
        String(record.caseNumber),
        record.action,
        record.targetId,
        record.targetTag,
        record.moderatorTag,
        record.reason,
        record.status,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [caseAction, caseSearch, cases]);

  const selectedCase = useMemo(
    () => cases.find((record) => record.caseNumber === selectedCaseNumber) ?? null,
    [cases, selectedCaseNumber]
  );

  const permissionItems: Array<[string, boolean]> = [
    ["Moderate Members", permissions.moderateMembers],
    ["Kick Members", permissions.kickMembers],
    ["Ban Members", permissions.banMembers],
    ["Manage Messages", permissions.manageMessages],
    ["Manage Channels", permissions.manageChannels],
    ["View Audit Log", permissions.viewAuditLog],
    ["Mod-log channel ready", permissions.logChannelReady],
  ];

  const statItems: Array<[string, string]> = [
    ["Total cases", stats.available ? stats.total.toLocaleString() : "—"],
    ["Active", stats.available ? stats.active.toLocaleString() : "—"],
    ["Warnings", stats.available ? stats.warnings.toLocaleString() : "—"],
    ["AutoMod", stats.available ? stats.automod.toLocaleString() : "—"],
    ["Last 24 hours", stats.available ? stats.last24Hours.toLocaleString() : "—"],
  ];

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={handleSave}
        onReset={handleReset}
      />
      <ServerErrorBanner message={serverError ?? validationMessage} />

      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statItems.map(([label, value]) => (
          <div key={label} className="glass rounded-xl p-4">
            <Gavel className="mb-2 h-4 w-4 text-violet-bright" />
            <p className="text-[11px] uppercase tracking-wide text-ash">{label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-fog">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <DashboardCard
          title="Moderation foundation"
          description="Control staff access, punishment defaults, notifications, and case logging."
          action={<ShieldCheck className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ToggleRow
                id="moderation-enabled"
                label="Enable moderation commands"
                description="Controls warn, timeout, kick, ban, unban, and case commands."
                checked={config.moderationCommandsEnabled}
                onChange={(checked) => patchConfig({ moderationCommandsEnabled: checked })}
              />
              <ToggleRow
                id="dm-punished-users"
                label="DM punished users"
                description="Attempt to notify members before or after a moderation action."
                checked={config.dmPunishedUsers}
                onChange={(checked) => patchConfig({ dmPunishedUsers: checked })}
              />
              <ToggleRow
                id="require-reason"
                label="Require moderation reasons"
                description="Timeout removal, unban, and warning clearing require a reason."
                checked={config.requireModerationReason}
                onChange={(checked) => patchConfig({ requireModerationReason: checked })}
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mod-log-channel">Moderation log channel</Label>
                <select
                  id="mod-log-channel"
                  className={`${selectClass} mt-1.5`}
                  value={config.modLogChannelId ?? "none"}
                  onChange={(event) =>
                    patchConfig({
                      modLogChannelId:
                        event.target.value === "none" ? null : event.target.value,
                    })
                  }
                >
                  <option value="none">No log channel</option>
                  {initialData.channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="default-timeout">Default timeout duration (minutes)</Label>
                <Input
                  id="default-timeout"
                  className="mt-1.5"
                  type="number"
                  min={1}
                  max={40320}
                  value={config.defaultTimeoutMinutes}
                  onChange={(event) =>
                    patchConfig({ defaultTimeoutMinutes: Number(event.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Bot permission readiness"
          description="Missing permissions or role hierarchy will safely block affected actions."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {permissionItems.map(([label, ready]) => (
              <PermissionBadge key={label} label={label} ready={ready} />
            ))}
          </div>
          <p className="mt-3 text-xs text-ash">
            CURSED's highest role position is {permissions.botHighestRolePosition}. Members at or
            above it cannot be moderated by the bot.
          </p>
        </DashboardCard>

        <DashboardCard
          title="Moderator roles"
          description="Members with these roles may use moderation commands even without individual Discord punishment permissions."
          action={<UserCog className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {initialData.roles.map((role) => {
              const checked = config.moderatorRoleIds.includes(role.id);
              return (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-fog hover:border-violet/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role.id)}
                    className="h-4 w-4 accent-violet"
                  />
                  <span className="truncate">{role.name}</span>
                </label>
              );
            })}
          </div>
          {!initialData.roles.length ? (
            <p className="text-sm text-ash">No selectable roles are available.</p>
          ) : null}
        </DashboardCard>

        <DashboardCard
          title="AutoMod protection"
          description="Protection actions are logged as persistent moderation cases."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ToggleRow
                id="anti-spam"
                label="Anti-spam"
                description="Detect rapid spam and apply the existing timeout action."
                checked={config.antiSpam}
                onChange={(checked) => patchConfig({ antiSpam: checked })}
              />
              <ToggleRow
                id="anti-link"
                label="Anti-link"
                description="Remove non-whitelisted web links."
                checked={config.antiLink}
                onChange={(checked) => patchConfig({ antiLink: checked })}
              />
              <ToggleRow
                id="anti-invite"
                label="Anti-invite"
                description="Remove Discord invite links."
                checked={config.antiInvite}
                onChange={(checked) => patchConfig({ antiInvite: checked })}
              />
            </div>
            <div>
              <Label htmlFor="whitelist-domain">Allowed link domains</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="whitelist-domain"
                  value={domainDraft}
                  placeholder="example.com"
                  onChange={(event) => setDomainDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDomain();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addDomain}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.linkWhitelist.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() =>
                      patchConfig({
                        linkWhitelist: config.linkWhitelist.filter(
                          (item) => item !== domain
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ash hover:border-crimson/40 hover:text-fog"
                  >
                    {domain}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                {!config.linkWhitelist.length ? (
                  <span className="text-xs text-ash">No domains are whitelisted.</span>
                ) : null}
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Warning escalation"
          description="Automatically timeout, kick, or ban when an exact active-warning count is reached."
        >
          <ToggleRow
            id="warning-escalation"
            label="Enable warning escalation"
            description="Escalation runs only when the new warning total exactly matches a threshold."
            checked={config.warningEscalationEnabled}
            onChange={(checked) => patchConfig({ warningEscalationEnabled: checked })}
          />

          <div className="mt-4 space-y-3">
            {config.warningThresholds.map((threshold, index) => (
              <div
                key={`${threshold.warnings}-${index}`}
                className="grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:grid-cols-[1fr_1.2fr_1.2fr_auto]"
              >
                <div>
                  <Label htmlFor={`threshold-warnings-${index}`}>Warnings</Label>
                  <Input
                    id={`threshold-warnings-${index}`}
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={100}
                    value={threshold.warnings}
                    onChange={(event) =>
                      patchThreshold(index, { warnings: Number(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`threshold-action-${index}`}>Action</Label>
                  <select
                    id={`threshold-action-${index}`}
                    className={`${selectClass} mt-1.5`}
                    value={threshold.action}
                    onChange={(event) => {
                      const action = event.target.value as WarningEscalationAction;
                      patchThreshold(index, {
                        action,
                        durationMinutes:
                          action === "timeout" ? threshold.durationMinutes ?? 60 : null,
                      });
                    }}
                  >
                    <option value="timeout">Timeout</option>
                    <option value="kick">Kick</option>
                    <option value="ban">Ban</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`threshold-duration-${index}`}>Duration (minutes)</Label>
                  <Input
                    id={`threshold-duration-${index}`}
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={40320}
                    disabled={threshold.action !== "timeout"}
                    value={
                      threshold.action === "timeout"
                        ? threshold.durationMinutes ?? 60
                        : ""
                    }
                    onChange={(event) =>
                      patchThreshold(index, {
                        durationMinutes: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeThreshold(index)}
                    className="text-crimson-bright hover:text-crimson-bright"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {config.warningThresholds.length < 10 ? (
              <Button type="button" variant="outline" onClick={addThreshold}>
                <Plus className="h-4 w-4" />
                Add threshold
              </Button>
            ) : null}
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

        <DashboardCard
          title="Persistent moderation cases"
          description="Cases are stored in MongoDB and survive Railway deployments."
          action={<Gavel className="h-5 w-5 text-violet-bright" />}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ash" />
              <Input
                value={caseSearch}
                onChange={(event) => setCaseSearch(event.target.value)}
                placeholder="Search number, user, moderator, reason..."
                className="pl-9"
              />
            </div>
            <select
              className={selectClass}
              value={caseAction}
              onChange={(event) => setCaseAction(event.target.value)}
            >
              <option value="all">All actions</option>
              {[...new Set(cases.map((record) => record.action))]
                .sort()
                .map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll("_", " ")}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {filteredCases.length ? (
                filteredCases.map((record) => (
                  <CaseCard
                    key={record.caseNumber}
                    record={record}
                    selected={record.caseNumber === selectedCaseNumber}
                    onSelect={() => setSelectedCaseNumber(record.caseNumber)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-ash">
                  No moderation cases match this filter yet.
                </div>
              )}
            </div>

            <div>
              {selectedCase ? (
                <CaseInspector
                  record={selectedCase}
                  busy={caseBusy}
                  onUpdate={(operation) =>
                    updateCase(selectedCase.caseNumber, operation)
                  }
                  onClose={() => setSelectedCaseNumber(null)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center">
                  <Gavel className="mx-auto h-6 w-6 text-ash" />
                  <p className="mt-3 text-sm text-fog">Select a case to inspect it.</p>
                  <p className="mt-1 text-xs text-ash">
                    Edit its reason, revoke the record, or hide it from normal views.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
