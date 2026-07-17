"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
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
  ModerationCase,
  ModerationCaseOperation,
  ModerationConfig,
  ModerationData,
  WarningEscalationAction,
  WarningThreshold,
} from "@/types/moderation";

interface Props {
  guildId: string;
  initialData: ModerationData;
}

const selectClass =
  "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:opacity-50";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function domain(value: string): string {
  return (value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "").trim();
}

function normalize(config: ModerationConfig): ModerationConfig {
  return {
    ...config,
    moderatorRoleIds: [...new Set(config.moderatorRoleIds.map(String))],
    linkWhitelist: [...new Set(config.linkWhitelist.map(domain).filter(Boolean))],
    warningThresholds: [...config.warningThresholds]
      .map((item) => ({
        warnings: Number(item.warnings),
        action: item.action,
        durationMinutes: item.action === "timeout" ? Number(item.durationMinutes ?? 60) : null,
      }))
      .sort((a, b) => a.warnings - b.warnings),
  };
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

function CasePanel({
  record,
  busy,
  onChange,
  onClose,
}: {
  record: ModerationCase;
  busy: boolean;
  onChange: (operation: ModerationCaseOperation) => Promise<void>;
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
          <p className="text-xs text-ash">
            {record.action.replaceAll("_", " ")} · {record.status} · {record.source}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" /> Close
        </Button>
      </div>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-white/[0.07] p-3">
          <p className="text-ash">Target</p>
          <p className="mt-1 break-all text-fog">{record.targetTag} · {record.targetId}</p>
        </div>
        <div className="rounded-lg border border-white/[0.07] p-3">
          <p className="text-ash">Moderator</p>
          <p className="mt-1 text-fog">{record.moderatorTag}</p>
        </div>
      </div>
      <Label htmlFor={`reason-${record.caseNumber}`} className="mt-4 block">Reason</Label>
      <Textarea
        id={`reason-${record.caseNumber}`}
        className="mt-1.5"
        rows={4}
        maxLength={2000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !reason.trim() || reason.trim() === record.reason}
          onClick={() => onChange({ operation: "reason", reason: reason.trim() })}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Update reason
        </Button>
      </div>
      {record.status === "active" ? (
        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <Label htmlFor={`revoke-${record.caseNumber}`}>Revocation note</Label>
          <Input
            id={`revoke-${record.caseNumber}`}
            className="mt-1.5"
            maxLength={1000}
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="Optional explanation"
          />
          <p className="mt-1 text-xs text-ash">Revoking a case does not undo the Discord punishment.</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onChange({ operation: "revoke", reason: revokeReason.trim() || null })}
            >
              <ShieldAlert className="h-4 w-4" /> Revoke
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-crimson-bright"
              onClick={() => onChange({ operation: "delete" })}
            >
              <Trash2 className="h-4 w-4" /> Hide
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ModerationEditor({ guildId, initialData }: Props) {
  const { toast } = useToast();
  const start = useMemo(() => normalize(initialData.config), [initialData.config]);
  const [config, setConfig] = useState(() => clone(start));
  const [saved, setSaved] = useState(() => clone(start));
  const [permissions, setPermissions] = useState(initialData.botPermissions);
  const [stats, setStats] = useState(initialData.stats);
  const [cases, setCases] = useState(initialData.cases);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [caseBusy, setCaseBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [domainDraft, setDomainDraft] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [caseAction, setCaseAction] = useState("all");

  const clean = useMemo(() => normalize(config), [config]);
  const validation = useMemo(() => moderationConfigSchema.safeParse(clean), [clean]);
  const dirty = JSON.stringify(clean) !== JSON.stringify(saved);
  const validationError = validation.success ? null : validation.error.issues[0]?.message ?? "Invalid settings.";

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = useCallback((next: Partial<ModerationConfig>) => {
    setConfig((current) => ({ ...current, ...next }));
    setError(null);
    setSuccess(null);
  }, []);

  const reset = useCallback(() => {
    setConfig(clone(saved));
    setError(null);
    setSuccess(null);
  }, [saved]);

  const save = useCallback(async () => {
    const parsed = moderationConfigSchema.safeParse(clean);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid moderation settings.";
      setError(message);
      toast({ title: "Fix moderation settings", description: message, variant: "error" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/moderation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error ?? "Could not save moderation settings.";
        setError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }
      const next = normalize(data.config as ModerationConfig);
      setConfig(clone(next));
      setSaved(clone(next));
      if (data.botPermissions) setPermissions(data.botPermissions);
      setSuccess("The live Railway bot is now using these moderation settings.");
      toast({ title: "Moderation saved", description: "Changes are active in CURSED.", variant: "success" });
    } catch {
      setError("Network error - could not reach the moderation API.");
    } finally {
      setSaving(false);
    }
  }, [clean, guildId, toast]);

  const toggleRole = (roleId: string) => {
    patch({
      moderatorRoleIds: config.moderatorRoleIds.includes(roleId)
        ? config.moderatorRoleIds.filter((id) => id !== roleId)
        : [...config.moderatorRoleIds, roleId],
    });
  };

  const addDomain = () => {
    const value = domain(domainDraft);
    if (!value) return;
    patch({ linkWhitelist: [...new Set([...config.linkWhitelist, value])] });
    setDomainDraft("");
  };

  const patchThreshold = (index: number, next: Partial<WarningThreshold>) => {
    patch({
      warningThresholds: config.warningThresholds.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item
      ),
    });
  };

  const updateCase = useCallback(
    async (caseNumber: number, operation: ModerationCaseOperation) => {
      setCaseBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/guilds/${guildId}/moderation/cases/${caseNumber}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operation),
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data?.error ?? "Could not update this case.";
          setError(message);
          toast({ title: "Case update failed", description: message, variant: "error" });
          return;
        }
        if (operation.operation === "delete") {
          setCases((current) => current.filter((item) => item.caseNumber !== caseNumber));
          setSelected(null);
        } else {
          setCases((current) => current.map((item) => item.caseNumber === caseNumber ? data.case : item));
        }
        if (data.stats) setStats(data.stats);
        toast({ title: "Case updated", description: `Case #${caseNumber} was updated.`, variant: "success" });
      } catch {
        setError("Network error - could not update this case.");
      } finally {
        setCaseBusy(false);
      }
    },
    [guildId, toast]
  );

  const filtered = useMemo(() => {
    const query = caseSearch.trim().toLowerCase();
    return cases.filter((record) => {
      if (caseAction !== "all" && record.action !== caseAction) return false;
      return !query || [
        String(record.caseNumber), record.action, record.targetId, record.targetTag,
        record.moderatorTag, record.reason, record.status,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [caseAction, caseSearch, cases]);

  const chosen = cases.find((record) => record.caseNumber === selected) ?? null;
  const permissionItems: Array<[string, boolean]> = [
    ["Moderate Members", permissions.moderateMembers],
    ["Kick Members", permissions.kickMembers],
    ["Ban Members", permissions.banMembers],
    ["Manage Messages", permissions.manageMessages],
    ["Manage Channels", permissions.manageChannels],
    ["View Audit Log", permissions.viewAuditLog],
    ["Mod-log ready", permissions.logChannelReady],
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
      <UnsavedChangesBanner dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} />
      <ServerErrorBanner message={error ?? validationError} />
      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {success}
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
        <DashboardCard title="Moderation foundation" description="Staff access, punishment defaults, notifications, and logging." action={<ShieldCheck className="h-5 w-5 text-violet-bright" />}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Toggle id="moderation-enabled" label="Enable moderation commands" description="Controls warn, timeout, kick, ban, unban, and case commands." checked={config.moderationCommandsEnabled} onChange={(value) => patch({ moderationCommandsEnabled: value })} />
              <Toggle id="dm-users" label="DM punished users" description="Attempt to notify affected members." checked={config.dmPunishedUsers} onChange={(value) => patch({ dmPunishedUsers: value })} />
              <Toggle id="require-reason" label="Require reasons" description="Require a reason where the slash command permits one." checked={config.requireModerationReason} onChange={(value) => patch({ requireModerationReason: value })} />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mod-log">Moderation log channel</Label>
                <select id="mod-log" className={`${selectClass} mt-1.5`} value={config.modLogChannelId ?? "none"} onChange={(event) => patch({ modLogChannelId: event.target.value === "none" ? null : event.target.value })}>
                  <option value="none">No log channel</option>
                  {initialData.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="default-timeout">Default timeout minutes</Label>
                <Input id="default-timeout" className="mt-1.5" type="number" min={1} max={40320} value={config.defaultTimeoutMinutes} onChange={(event) => patch({ defaultTimeoutMinutes: Number(event.target.value) })} />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Bot permission readiness" description="Missing permissions or role hierarchy safely block affected actions.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {permissionItems.map(([label, ready]) => (
              <div key={label} className={`rounded-lg border px-3 py-2 text-xs ${ready ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200" : "border-amber-400/30 bg-amber-400/[0.06] text-amber-200"}`}>
                {ready ? "✓" : "!"} {label}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ash">The highest CURSED role position is {permissions.botHighestRolePosition}. Members at or above it cannot be moderated.</p>
        </DashboardCard>

        <DashboardCard title="Moderator roles" description="Selected roles may use moderation commands after all bot and hierarchy checks pass." action={<UserCog className="h-5 w-5 text-violet-bright" />}>
          <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {initialData.roles.map((role) => (
              <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-fog">
                <input type="checkbox" checked={config.moderatorRoleIds.includes(role.id)} onChange={() => toggleRole(role.id)} className="h-4 w-4 accent-violet" />
                <span className="truncate">{role.name}</span>
              </label>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="AutoMod protection" description="AutoMod actions create persistent moderation cases.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Toggle id="anti-spam" label="Anti-spam" description="Detect rapid message spam." checked={config.antiSpam} onChange={(value) => patch({ antiSpam: value })} />
              <Toggle id="anti-link" label="Anti-link" description="Remove non-whitelisted web links." checked={config.antiLink} onChange={(value) => patch({ antiLink: value })} />
              <Toggle id="anti-invite" label="Anti-invite" description="Remove Discord invite links." checked={config.antiInvite} onChange={(value) => patch({ antiInvite: value })} />
            </div>
            <div>
              <Label htmlFor="domain">Allowed domains</Label>
              <div className="mt-1.5 flex gap-2">
                <Input id="domain" value={domainDraft} placeholder="example.com" onChange={(event) => setDomainDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDomain(); } }} />
                <Button type="button" variant="outline" onClick={addDomain}><Plus className="h-4 w-4" /> Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.linkWhitelist.map((item) => (
                  <button key={item} type="button" onClick={() => patch({ linkWhitelist: config.linkWhitelist.filter((value) => value !== item) })} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-ash">
                    {item}<X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Warning escalation" description="Apply a timeout, kick, or ban at an exact active-warning count.">
          <Toggle id="escalation" label="Enable warning escalation" description="Actions run only when the new warning count matches a threshold." checked={config.warningEscalationEnabled} onChange={(value) => patch({ warningEscalationEnabled: value })} />
          <div className="mt-4 space-y-3">
            {config.warningThresholds.map((item, index) => (
              <div key={`${item.warnings}-${index}`} className="grid gap-3 rounded-xl border border-white/[0.08] p-3 sm:grid-cols-[1fr_1.2fr_1.2fr_auto]">
                <div><Label htmlFor={`warnings-${index}`}>Warnings</Label><Input id={`warnings-${index}`} className="mt-1.5" type="number" min={1} max={100} value={item.warnings} onChange={(event) => patchThreshold(index, { warnings: Number(event.target.value) })} /></div>
                <div><Label htmlFor={`action-${index}`}>Action</Label><select id={`action-${index}`} className={`${selectClass} mt-1.5`} value={item.action} onChange={(event) => { const action = event.target.value as WarningEscalationAction; patchThreshold(index, { action, durationMinutes: action === "timeout" ? item.durationMinutes ?? 60 : null }); }}><option value="timeout">Timeout</option><option value="kick">Kick</option><option value="ban">Ban</option></select></div>
                <div><Label htmlFor={`duration-${index}`}>Duration minutes</Label><Input id={`duration-${index}`} className="mt-1.5" type="number" min={1} max={40320} disabled={item.action !== "timeout"} value={item.action === "timeout" ? item.durationMinutes ?? 60 : ""} onChange={(event) => patchThreshold(index, { durationMinutes: Number(event.target.value) })} /></div>
                <div className="flex items-end"><Button type="button" size="sm" variant="ghost" className="text-crimson-bright" onClick={() => patch({ warningThresholds: config.warningThresholds.filter((_value, valueIndex) => valueIndex !== index) })}><Trash2 className="h-4 w-4" /> Remove</Button></div>
              </div>
            ))}
            {config.warningThresholds.length < 10 ? <Button type="button" variant="outline" onClick={() => { const high = config.warningThresholds.reduce((value, item) => Math.max(value, item.warnings), 0); patch({ warningThresholds: [...config.warningThresholds, { warnings: Math.min(100, high + 1), action: "timeout", durationMinutes: 60 }] }); }}><Plus className="h-4 w-4" /> Add threshold</Button> : null}
          </div>
        </DashboardCard>

        <div className="flex justify-end"><EditorActions dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} /></div>

        <DashboardCard title="Persistent moderation cases" description="Search and manage MongoDB-backed case records." action={<Gavel className="h-5 w-5 text-violet-bright" />}>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ash" /><Input className="pl-9" value={caseSearch} onChange={(event) => setCaseSearch(event.target.value)} placeholder="Search case, user, moderator, reason..." /></div>
            <select className={selectClass} value={caseAction} onChange={(event) => setCaseAction(event.target.value)}><option value="all">All actions</option>{[...new Set(cases.map((item) => item.action))].sort().map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[620px] space-y-2 overflow-y-auto">
              {filtered.length ? filtered.map((record) => (
                <button key={record.caseNumber} type="button" onClick={() => setSelected(record.caseNumber)} className={`w-full rounded-xl border p-4 text-left ${selected === record.caseNumber ? "border-violet/60 bg-violet/[0.08]" : "border-white/[0.08]"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-display text-sm font-semibold text-fog">Case #{record.caseNumber} · {record.action.replaceAll("_", " ")}</span><span className="text-[10px] uppercase text-ash">{record.status}</span></div>
                  <p className="mt-1 text-xs text-ash">{record.targetTag} · {record.targetId}</p><p className="mt-2 line-clamp-2 text-sm text-fog/90">{record.reason}</p>
                </button>
              )) : <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-ash">No matching cases yet.</div>}
            </div>
            {chosen ? <CasePanel record={chosen} busy={caseBusy} onChange={(operation) => updateCase(chosen.caseNumber, operation)} onClose={() => setSelected(null)} /> : <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center"><Gavel className="mx-auto h-6 w-6 text-ash" /><p className="mt-3 text-sm text-fog">Select a case to inspect it.</p></div>}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
