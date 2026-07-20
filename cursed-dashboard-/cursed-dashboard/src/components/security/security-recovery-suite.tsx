"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Download,
  FileClock,
  HeartPulse,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { EditorActions, ServerErrorBanner, UnsavedChangesBanner } from "@/components/dashboard/editor-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { securitySuiteConfigSchema } from "@/lib/validation/security-suite";
import type { SecurityResponseAction } from "@/types/security";
import type {
  SecuritySuiteActionRequest,
  SecuritySuiteActionResult,
  SecuritySuiteConfig,
  SecuritySuiteData,
} from "@/types/security-suite";

interface Props {
  guildId: string;
  initialData: SecuritySuiteData;
}

const selectClass = "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:opacity-50";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function Toggle({ id, label, description, checked, onChange }: {
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

function ResponseSelect({ value, onChange }: {
  value: SecurityResponseAction;
  onChange: (value: SecurityResponseAction) => void;
}) {
  return (
    <select className={`${selectClass} mt-1.5`} value={value} onChange={(event) => onChange(event.target.value as SecurityResponseAction)}>
      <option value="neutralize">Neutralize staff account</option>
      <option value="quarantine">Quarantine</option>
      <option value="lockdown">Emergency lockdown</option>
      <option value="alert">Alert only</option>
    </select>
  );
}

function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SecurityRecoverySuite({ guildId, initialData }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState(() => clone(initialData));
  const [config, setConfig] = useState(() => clone(initialData.config));
  const [saved, setSaved] = useState(() => clone(initialData.config));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [botId, setBotId] = useState("");
  const [botNote, setBotNote] = useState("");
  const [incidentId, setIncidentId] = useState("");

  const validation = useMemo(() => securitySuiteConfigSchema.safeParse(config), [config]);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const validationError = validation.success ? null : validation.error.issues[0]?.message ?? "Invalid recovery-suite settings.";

  function patch(next: Partial<SecuritySuiteConfig>) {
    setConfig((current) => ({ ...current, ...next }));
  }

  function reset() {
    setConfig(clone(saved));
    setError(null);
  }

  async function save() {
    if (!validation.success || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/security-suite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const body = await response.json() as SecuritySuiteData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save recovery-suite settings.");
      setData(body);
      setConfig(clone(body.config));
      setSaved(clone(body.config));
      toast({ title: "Recovery Suite saved", description: "Advanced security controls are updated.", variant: "success" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save recovery-suite settings.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: SecuritySuiteActionRequest): Promise<SecuritySuiteActionResult["result"] | null> {
    if (busy) return null;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/security-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const body = await response.json() as SecuritySuiteActionResult & { error?: string };
      if (!response.ok || !body.data) throw new Error(body.error ?? "Security action failed safely.");
      setData(body.data);
      setConfig(clone(body.data.config));
      setSaved(clone(body.data.config));
      return body.result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Security action failed safely.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createSnapshot() {
    const result = await runAction({ action: "backup-create", reason: actionReason.trim() || undefined });
    if (result?.ok) toast({ title: "Security snapshot created", description: "A persistent recovery point is ready.", variant: "success" });
  }

  async function restoreSnapshot(snapshotId: string, name: string) {
    const reason = actionReason.trim() || "Dashboard owner recovery";
    if (!window.confirm(`Restore missing objects from “${name}”? Existing healthy channels and roles will not be deleted.`)) return;
    const result = await runAction({ action: "backup-restore", snapshotId, reason });
    if (result?.ok) toast({ title: "Recovery completed", description: "Missing server objects were restored where Discord allowed.", variant: "success" });
  }

  async function addApproval() {
    const result = await runAction({
      action: "approval-add",
      botId: botId.trim(),
      expiresMinutes: config.botApprovals.defaultExpiryMinutes,
      note: botNote.trim() || undefined,
    });
    if (result?.ok) {
      setBotId("");
      setBotNote("");
      toast({ title: "Bot approved", description: "The approval is temporary and one-time by default.", variant: "success" });
    }
  }

  async function setIncident(active: boolean) {
    if (active && !actionReason.trim()) {
      setError("Enter an incident reason before enabling emergency mode.");
      return;
    }
    if (!window.confirm(active ? "Enable coordinated incident mode and its configured emergency actions?" : "End incident mode and restore any lockdown started by it?")) return;
    const result = await runAction(active
      ? { action: "incident-enable", reason: actionReason.trim(), durationMinutes: config.incidentMode.durationMinutes }
      : { action: "incident-disable", reason: actionReason.trim() || undefined });
    if (result?.ok) toast({ title: active ? "Incident mode active" : "Incident mode ended", description: "Live protection state has been refreshed.", variant: "success" });
  }

  async function refreshAudit() {
    const result = await runAction({ action: "security-audit" });
    if (result?.ok) toast({ title: "Security audit refreshed", description: "The latest permission and hierarchy checks are shown.", variant: "success" });
  }

  async function downloadReport(format: "html" | "json") {
    const result = await runAction({ action: "incident-report", incidentId: incidentId.trim() || undefined });
    if (!result?.ok || !result.report) return;
    if (format === "html" && typeof result.html === "string") {
      downloadText(`cursed-security-report-${Date.now()}.html`, result.html, "text/html;charset=utf-8");
    } else {
      downloadText(`cursed-security-report-${Date.now()}.json`, JSON.stringify(result.report, null, 2), "application/json;charset=utf-8");
    }
    toast({ title: "Incident report downloaded", description: `${result.report.incidentCount} incident event(s) included.`, variant: "success" });
  }

  const health = data.health;
  const healthColor = health.score >= 80 ? "text-emerald-300" : health.score >= 60 ? "text-amber-300" : "text-red-300";

  return (
    <div className="mt-8">
      <UnsavedChangesBanner dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} />
      <ServerErrorBanner message={error ?? validationError} />

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl border border-violet/30 bg-violet/10 p-3"><ShieldCheck className="h-6 w-6 text-violet-bright" /></div>
        <div>
          <h2 className="font-display text-xl font-semibold text-fog">Security Recovery Suite</h2>
          <p className="text-sm text-ash">Persistent recovery, tamper protection, incident coordination, staff safety and forensic reporting.</p>
        </div>
      </div>

      <div className="space-y-6">
        <DashboardCard title="Security health audit" description="Live 100-point assessment of permissions, hierarchy, dangerous roles, administrator bots and protection readiness." action={<HeartPulse className="h-5 w-5 text-violet-bright" />}>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr_1fr]">
            <div className="rounded-xl border border-white/[0.08] p-5 text-center">
              <p className={`font-display text-4xl font-bold ${healthColor}`}>{health.score}</p>
              <p className="mt-1 text-sm text-ash">Grade {health.grade} / 100</p>
              <Button className="mt-4" size="sm" variant="outline" disabled={busy} onClick={refreshAudit}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            </div>
            <div className="rounded-xl border border-white/[0.08] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ash">Issues</p><div className="mt-2 space-y-1 text-sm text-fog">{health.issues.length ? health.issues.map((item) => <p key={item}>• {item}</p>) : <p>No critical issues detected.</p>}</div></div>
            <div className="rounded-xl border border-white/[0.08] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ash">Recommendations</p><div className="mt-2 space-y-1 text-sm text-fog">{health.recommendations.length ? health.recommendations.map((item) => <p key={item}>• {item}</p>) : <p>Your current security configuration is strong.</p>}</div></div>
          </div>
        </DashboardCard>

        <DashboardCard title="Persistent backup and recovery" description="Creates MongoDB recovery points and safely recreates missing roles, channels, categories, overwrites and selected server settings." action={<History className="h-5 w-5 text-violet-bright" />}>
          <Toggle id="suite-backup" label="Automatic security snapshots" description="Capture scheduled server recovery points without deleting existing server objects." checked={config.backup.enabled} onChange={(enabled) => patch({ backup: { ...config.backup, enabled } })} />
          <Toggle id="suite-backup-settings" label="Restore safe server settings" description="Includes verification, content-filter, notification and AFK settings during owner restore." checked={config.backup.restoreServerSettings} onChange={(restoreServerSettings) => patch({ backup: { ...config.backup, restoreServerSettings } })} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
            <div><Label>Snapshot interval hours</Label><Input className="mt-1.5" type="number" min={1} max={168} value={config.backup.intervalHours} onChange={(event) => patch({ backup: { ...config.backup, intervalHours: Number(event.target.value) } })} /></div>
            <div><Label>Snapshots retained</Label><Input className="mt-1.5" type="number" min={1} max={30} value={config.backup.retentionCount} onChange={(event) => patch({ backup: { ...config.backup, retentionCount: Number(event.target.value) } })} /></div>
            <div><Label>Action reason</Label><Input className="mt-1.5" value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Manual snapshot or incident reason" /></div>
            <Button className="self-end" disabled={busy} onClick={createSnapshot}>Create snapshot</Button>
          </div>
          <div className="mt-4 space-y-2">{data.snapshots.map((snapshot) => <div key={snapshot.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] p-4 sm:flex-row sm:items-center"><div><p className="font-medium text-fog">{snapshot.name}</p><p className="text-xs text-ash">{snapshot.roleCount} roles • {snapshot.channelCount} channels • {snapshot.status} • {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString() : "Unknown time"}</p><p className="mt-1 font-mono text-[11px] text-ash">{snapshot.id}</p></div><Button size="sm" variant="outline" disabled={busy} onClick={() => restoreSnapshot(snapshot.id, snapshot.name)}>Restore missing objects</Button></div>)}{!data.snapshots.length ? <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-ash">No security snapshots yet.</p> : null}</div>
        </DashboardCard>

        <DashboardCard title="Permission and tamper protection" description="Detects attacks against CURSED's role, quarantine role and protection configuration, then alerts the owner and can activate incident mode." action={<LockKeyhole className="h-5 w-5 text-crimson-bright" />}>
          <Toggle id="suite-tamper" label="Enable tamper protection" description="Watches protected security roles and CURSED permission loss." checked={config.tamperProtection.enabled} onChange={(enabled) => patch({ tamperProtection: { ...config.tamperProtection, enabled } })} />
          <Toggle id="suite-owner-disable" label="Owner-only security changes" description="Only the server owner may disable recovery controls or alter protected approval settings." checked={config.tamperProtection.ownerOnlyDisable} onChange={(ownerOnlyDisable) => patch({ tamperProtection: { ...config.tamperProtection, ownerOnlyDisable } })} />
          <Toggle id="suite-protect-bot" label="Protect CURSED's highest role" description="Records suspicious changes to CURSED's active protection role." checked={config.tamperProtection.protectBotRole} onChange={(protectBotRole) => patch({ tamperProtection: { ...config.tamperProtection, protectBotRole } })} />
          <Toggle id="suite-protect-quarantine" label="Protect the quarantine role" description="Alerts the owner if the configured quarantine role is edited or deleted." checked={config.tamperProtection.protectQuarantineRole} onChange={(protectQuarantineRole) => patch({ tamperProtection: { ...config.tamperProtection, protectQuarantineRole } })} />
          <Toggle id="suite-tamper-incident" label="Start incident mode after tampering" description="Coordinates lockdown and stricter defenses after protection sabotage." checked={config.tamperProtection.autoIncidentMode} onChange={(autoIncidentMode) => patch({ tamperProtection: { ...config.tamperProtection, autoIncidentMode } })} />
        </DashboardCard>

        <DashboardCard title="Trusted bot approvals" description="Approve the exact bot ID before adding it. Unapproved additions remain blocked by anti-nuke." action={<Bot className="h-5 w-5 text-violet-bright" />}>
          <Toggle id="suite-approvals" label="Enable bot approvals" description="Allows owner-created temporary approval records." checked={config.botApprovals.enabled} onChange={(enabled) => patch({ botApprovals: { ...config.botApprovals, enabled } })} />
          <Toggle id="suite-one-time" label="One-time approvals" description="Consumes the approval when the exact bot joins." checked={config.botApprovals.oneTime} onChange={(oneTime) => patch({ botApprovals: { ...config.botApprovals, oneTime } })} />
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_120px_2fr_auto]">
            <Input value={botId} onChange={(event) => setBotId(event.target.value)} placeholder="Bot Discord ID" />
            <Input type="number" min={1} max={1440} value={config.botApprovals.defaultExpiryMinutes} onChange={(event) => patch({ botApprovals: { ...config.botApprovals, defaultExpiryMinutes: Number(event.target.value) } })} />
            <Input value={botNote} onChange={(event) => setBotNote(event.target.value)} placeholder="Approval note" />
            <Button disabled={busy || !/^\d{17,20}$/.test(botId.trim()) || !config.botApprovals.enabled} onClick={addApproval}>Approve bot</Button>
          </div>
          <div className="mt-4 space-y-2">{data.approvals.map((approval) => <div key={approval.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] p-3"><div><p className="text-sm text-fog">{approval.active ? "ACTIVE" : "USED / EXPIRED"} • {approval.botId}</p><p className="text-xs text-ash">Expires {new Date(approval.expiresAt).toLocaleString()}{approval.note ? ` • ${approval.note}` : ""}</p></div>{approval.active ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => runAction({ action: "approval-revoke", approvalId: approval.id })}>Revoke</Button> : null}</div>)}{!data.approvals.length ? <p className="text-sm text-ash">No bot approvals recorded.</p> : null}</div>
        </DashboardCard>

        <DashboardCard title="Coordinated incident mode" description="Raises protection sensitivity, blocks unapproved bot additions and can activate emergency lockdown for a defined period." action={<Activity className="h-5 w-5 text-crimson-bright" />}>
          <Toggle id="suite-incident-enabled" label="Enable incident mode controls" description="Allows manual and automatic emergency coordination." checked={config.incidentMode.enabled} onChange={(enabled) => patch({ incidentMode: { ...config.incidentMode, enabled } })} />
          <Toggle id="suite-incident-lockdown" label="Automatic lockdown" description="Locks configured public channels when incident mode starts." checked={config.incidentMode.autoLockdown} onChange={(autoLockdown) => patch({ incidentMode: { ...config.incidentMode, autoLockdown } })} />
          <Toggle id="suite-incident-shield" label="Strict Message Shield" description="Temporarily lowers spam, invite, link and mention thresholds." checked={config.incidentMode.strictMessageShield} onChange={(strictMessageShield) => patch({ incidentMode: { ...config.incidentMode, strictMessageShield } })} />
          <Toggle id="suite-incident-bots" label="Block unapproved bots" description="Keeps exact bot-ID approval checks active during an incident." checked={config.incidentMode.blockUnapprovedBots} onChange={(blockUnapprovedBots) => patch({ incidentMode: { ...config.incidentMode, blockUnapprovedBots } })} />
          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto_auto]">
            <div><Label>Duration minutes</Label><Input className="mt-1.5" type="number" min={5} max={1440} value={config.incidentMode.durationMinutes} onChange={(event) => patch({ incidentMode: { ...config.incidentMode, durationMinutes: Number(event.target.value) } })} /></div>
            <div><Label>Incident reason</Label><Input className="mt-1.5" value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Required when enabling incident mode" /></div>
            <Button className="self-end" disabled={busy || data.incidentMode.active || !config.incidentMode.enabled} onClick={() => setIncident(true)}>Enable</Button>
            <Button className="self-end" variant="outline" disabled={busy || !data.incidentMode.active} onClick={() => setIncident(false)}>End mode</Button>
          </div>
          <p className="mt-3 text-sm text-ash">Live status: <span className={data.incidentMode.active ? "text-red-300" : "text-emerald-300"}>{data.incidentMode.active ? "ACTIVE" : "INACTIVE"}</span>{data.incidentMode.expiresAt ? ` • expires ${new Date(data.incidentMode.expiresAt).toLocaleString()}` : ""}</p>
        </DashboardCard>

        <DashboardCard title="Advanced anti-raid verification" description="Adds join-risk signals on top of the existing rolling join window and account-age detection.">
          <Toggle id="suite-avatar" label="Require a custom avatar during high-risk joins" description="Missing avatars contribute to Join Gate risk scoring." checked={config.antiRaidAdvanced.requireAvatar} onChange={(requireAvatar) => patch({ antiRaidAdvanced: { ...config.antiRaidAdvanced, requireAvatar } })} />
          <Toggle id="suite-name-check" label="Suspicious username detection" description="Detects common fake-support, giveaway and advertising name patterns." checked={config.antiRaidAdvanced.suspiciousNameCheck} onChange={(suspiciousNameCheck) => patch({ antiRaidAdvanced: { ...config.antiRaidAdvanced, suspiciousNameCheck } })} />
          <div className="mt-4 max-w-xs"><Label>Risk score threshold</Label><Input className="mt-1.5" type="number" min={1} max={10} value={config.antiRaidAdvanced.riskScoreThreshold} onChange={(event) => patch({ antiRaidAdvanced: { ...config.antiRaidAdvanced, riskScoreThreshold: Number(event.target.value) } })} /></div>
        </DashboardCard>

        <DashboardCard title="Staff action limits" description="Independent rolling safety limits for unusually fast moderator bans, kicks, channel edits, role edits and webhook actions.">
          <Toggle id="suite-staff-limits" label="Enable staff safety limits" description="Freezes or alerts on staff accounts acting beyond configured limits." checked={config.staffLimits.enabled} onChange={(enabled) => patch({ staffLimits: { ...config.staffLimits, enabled } })} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label>Window seconds</Label><Input className="mt-1.5" type="number" min={10} max={300} value={config.staffLimits.windowSeconds} onChange={(event) => patch({ staffLimits: { ...config.staffLimits, windowSeconds: Number(event.target.value) } })} /></div>
            <div><Label>Response</Label><ResponseSelect value={config.staffLimits.action} onChange={(action) => patch({ staffLimits: { ...config.staffLimits, action } })} /></div>
            {Object.entries(config.staffLimits.thresholds).map(([key, value]) => <div key={key}><Label>{key.replace(/([A-Z])/g, " $1")}</Label><Input className="mt-1.5" type="number" min={1} max={100} value={value} onChange={(event) => patch({ staffLimits: { ...config.staffLimits, thresholds: { ...config.staffLimits.thresholds, [key]: Number(event.target.value) } } })} /></div>)}
          </div>
        </DashboardCard>

        <DashboardCard title="Advanced incident reports" description="Downloads a forensic HTML or JSON timeline containing incident times, actors, targets, actions and available evidence." action={<FileClock className="h-5 w-5 text-violet-bright" />}>
          <Toggle id="suite-reports" label="Enable incident reports" description="Allows owner-generated security timelines." checked={config.reports.enabled} onChange={(enabled) => patch({ reports: { ...config.reports, enabled } })} />
          <Toggle id="suite-report-audit" label="Include available audit details" description="Keeps stored audit and recovery evidence in report records." checked={config.reports.includeAuditDetails} onChange={(includeAuditDetails) => patch({ reports: { ...config.reports, includeAuditDetails } })} />
          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto_auto]">
            <div><Label>Maximum timeline events</Label><Input className="mt-1.5" type="number" min={10} max={200} value={config.reports.maxTimelineEvents} onChange={(event) => patch({ reports: { ...config.reports, maxTimelineEvents: Number(event.target.value) } })} /></div>
            <div><Label>Focus incident ID (optional)</Label><Input className="mt-1.5" value={incidentId} onChange={(event) => setIncidentId(event.target.value)} placeholder="MongoDB incident ID" /></div>
            <Button className="self-end" variant="outline" disabled={busy || !config.reports.enabled} onClick={() => downloadReport("html")}><Download className="h-4 w-4" /> HTML</Button>
            <Button className="self-end" variant="outline" disabled={busy || !config.reports.enabled} onClick={() => downloadReport("json")}><Download className="h-4 w-4" /> JSON</Button>
          </div>
        </DashboardCard>

        <div className="flex justify-end"><EditorActions dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} /></div>
      </div>
    </div>
  );
}