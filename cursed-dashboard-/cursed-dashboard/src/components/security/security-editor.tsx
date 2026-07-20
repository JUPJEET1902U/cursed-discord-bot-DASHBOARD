"use client";

import { useMemo, useState } from "react";
import { KeyRound, LockKeyhole, Plus, Radar, ShieldAlert, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { EditorActions, ServerErrorBanner, UnsavedChangesBanner } from "@/components/dashboard/editor-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { securityConfigSchema } from "@/lib/validation/security";
import type {
  SecurityActionRequest,
  SecurityConfig,
  SecurityData,
  SecurityIncidentOperation,
  SecurityResponseAction,
  TrustedEntry,
  TrustedScope,
  TrustedSubjectType,
} from "@/types/security";

interface Props { guildId: string; initialData: SecurityData }

const selectClass = "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:opacity-50";
const scopes: Array<[TrustedScope, string]> = [
  ["automod", "AutoMod"], ["antiRaid", "Anti-raid"], ["massModeration", "Mass moderation"],
  ["manageChannels", "Channels"], ["manageRoles", "Roles"], ["addBots", "Add bots"],
  ["manageWebhooks", "Webhooks"], ["manualModeration", "Manual protection"],
];
const thresholds: Array<[keyof SecurityConfig["antiNuke"]["thresholds"], string, number]> = [
  ["bans", "Bans", 50], ["kicks", "Kicks", 50], ["channelDeletes", "Channel deletes", 25],
  ["channelCreates", "Channel creates", 50], ["channelUpdates", "Channel edits", 50],
  ["roleDeletes", "Role deletes", 25], ["roleCreates", "Role creates", 50], ["roleUpdates", "Role edits", 50],
  ["webhookChanges", "Webhook changes", 25], ["dangerousRoleChanges", "Dangerous permissions", 25],
  ["botAdds", "Bot additions", 25], ["guildUpdates", "Server setting edits", 25],
];

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }

function Toggle({ id, label, description, checked, onChange }: {
  id: string; label: string; description: string; checked: boolean; onChange: (value: boolean) => void;
}) {
  return <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-0">
    <div><Label htmlFor={id}>{label}</Label><p className="mt-0.5 text-xs text-ash">{description}</p></div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>;
}

function ResponseSelect({ value, onChange }: { value: SecurityResponseAction; onChange: (value: SecurityResponseAction) => void }) {
  return <select className={`${selectClass} mt-1.5`} value={value} onChange={(event) => onChange(event.target.value as SecurityResponseAction)}>
    <option value="neutralize">Neutralize attacker</option>
    <option value="quarantine">Quarantine</option>
    <option value="lockdown">Emergency lockdown</option>
    <option value="alert">Alert only</option>
  </select>;
}

export function SecurityEditor({ guildId, initialData }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState(() => clone(initialData));
  const [config, setConfig] = useState(() => clone(initialData.config));
  const [saved, setSaved] = useState(() => clone(initialData.config));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [userId, setUserId] = useState("");
  const [trustedType, setTrustedType] = useState<TrustedSubjectType>("user");
  const [trustedId, setTrustedId] = useState("");
  const [trustedScopes, setTrustedScopes] = useState<TrustedScope[]>(["automod"]);
  const validation = useMemo(() => securityConfigSchema.safeParse(config), [config]);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const validationError = validation.success ? null : validation.error.issues[0]?.message ?? "Invalid Server Protection settings.";

  function patch(next: Partial<SecurityConfig>) { setConfig((current) => ({ ...current, ...next })) }
  function reset() { setConfig(clone(saved)); setError(null) }

  function applyHardenedPreset() {
    if (!window.confirm("Apply CURSED Hardened protection values? Review trusted users and bot hierarchy before saving.")) return;
    setConfig((current) => ({
      ...current,
      enabled: true,
      antiRaid: { ...current.antiRaid, enabled: true, joinThreshold: 6, windowSeconds: 15, minAccountAgeHours: 72, activeRaidSeconds: 300, action: "quarantine" },
      antiNuke: {
        ...current.antiNuke,
        enabled: true,
        action: "neutralize",
        windowSeconds: 10,
        restoreDeletedChannels: true,
        restoreDeletedRoles: true,
        removeDangerousRoles: true,
        banMaliciousBots: true,
        autoLockdown: true,
        ownerAlerts: true,
        neutralizeTimeoutMinutes: 10080,
        thresholds: {
          bans: 3, kicks: 3, channelDeletes: 1, channelCreates: 3, channelUpdates: 3,
          roleDeletes: 1, roleCreates: 3, roleUpdates: 2, webhookChanges: 1,
          dangerousRoleChanges: 1, botAdds: 1, guildUpdates: 2,
        },
      },
      messageShield: {
        enabled: true, windowSeconds: 8, repeatedMessageThreshold: 3, rapidMessageThreshold: 5,
        botInviteThreshold: 2, inviteThreshold: 3, linkThreshold: 6, maxMentions: 5,
      },
      lockdown: { ...current.lockdown, enabled: true, raiseVerificationLevel: true },
      trusted: { ...current.trusted, enabled: true },
    }));
  }

  async function save() {
    if (!validation.success || saving) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/security`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data) });
      const body = await response.json() as SecurityData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save settings.");
      setData(body); setConfig(clone(body.config)); setSaved(clone(body.config));
      toast({ title: "Server Protection saved", description: "CURSED will use the updated hardened rules.", variant: "success" });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings.") }
    finally { setSaving(false) }
  }

  async function runAction(action: SecurityActionRequest) {
    if (busy) return;
    if (action.action.startsWith("lockdown") && !window.confirm("This changes server channel permissions. Continue?")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/security/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      const body = await response.json() as { data?: SecurityData; error?: string };
      if (!response.ok || !body.data) throw new Error(body.error ?? "Security action failed safely.");
      setData(body.data); setConfig(clone(body.data.config)); setSaved(clone(body.data.config)); setReason(""); setUserId("");
      toast({ title: "Security action completed", description: "Live server state refreshed.", variant: "success" });
    } catch (err) { setError(err instanceof Error ? err.message : "Security action failed safely.") }
    finally { setBusy(false) }
  }

  async function updateIncident(id: string, operation: SecurityIncidentOperation) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/security/incidents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(operation) });
      const body = await response.json() as { incident?: SecurityData["incidents"][number]; stats?: SecurityData["stats"]; error?: string };
      if (!response.ok || !body.incident) throw new Error(body.error ?? "Could not update incident.");
      setData((current) => ({ ...current, stats: body.stats ?? current.stats, incidents: current.incidents.map((item) => item.id === id ? body.incident! : item) }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update incident.") }
    finally { setBusy(false) }
  }

  function addTrusted() {
    const id = trustedId.trim();
    if (!/^\d{17,20}$/.test(id) || !trustedScopes.length) { setError("Enter a valid Discord ID and choose at least one scope."); return }
    const entry: TrustedEntry = { subjectType: trustedType, subjectId: id, scopes: trustedScopes };
    const entries = config.trusted.entries.filter((item) => !(item.subjectType === entry.subjectType && item.subjectId === entry.subjectId));
    patch({ trusted: { ...config.trusted, entries: [...entries, entry] } }); setTrustedId("");
  }

  const statItems = [
    ["Incidents", data.stats.available ? data.stats.total : "—"], ["Open", data.stats.available ? data.stats.open : "—"],
    ["Critical", data.stats.available ? data.stats.critical : "—"], ["24 hours", data.stats.available ? data.stats.last24Hours : "—"],
    ["Quarantined", data.quarantineCount],
  ];

  return <div>
    <UnsavedChangesBanner dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} />
    <ServerErrorBanner message={error ?? validationError} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{statItems.map(([label, value]) => <div key={label} className="glass rounded-xl p-4"><p className="text-[11px] uppercase tracking-wide text-ash">{label}</p><p className="mt-1 font-display text-lg font-semibold text-fog">{String(value)}</p></div>)}</div>

    <div className="space-y-6">
      <DashboardCard title="Protection status" description="Immediate audit-log response, attacker neutralization, recovery and coordinated spam defense." action={<ShieldAlert className="h-5 w-5 text-violet-bright" />}>
        <Toggle id="security-enabled" label="Enable Server Protection" description="Arms anti-raid, anti-nuke and Message Shield." checked={config.enabled} onChange={(enabled) => patch({ enabled })} />
        <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={applyHardenedPreset}>Apply hardened preset</Button><p className="self-center text-xs text-ash">Recommended: CURSED role above every non-owner staff and bot role.</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.botPermissions).filter(([key]) => key !== "botHighestRolePosition").map(([key, ready]) => <div key={key} className={`rounded-lg border px-3 py-2 text-xs ${ready ? "border-emerald-400/30 text-emerald-200" : "border-amber-400/30 text-amber-200"}`}>{ready ? "✓" : "!"} {key}</div>)}
        </div>
        <div className="mt-4"><Label>Security log channel</Label><select className={`${selectClass} mt-1.5`} value={config.securityLogChannelId ?? "none"} onChange={(event) => patch({ securityLogChannelId: event.target.value === "none" ? null : event.target.value })}><option value="none">No channel</option>{data.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}</select></div>
      </DashboardCard>

      <DashboardCard title="Anti-raid" description="Detect join bursts, isolate suspicious accounts and keep raid mode active during an attack." action={<Radar className="h-5 w-5 text-violet-bright" />}>
        <Toggle id="anti-raid" label="Enable anti-raid" description="Uses a rolling join window and account-age check." checked={config.antiRaid.enabled} onChange={(enabled) => patch({ antiRaid: { ...config.antiRaid, enabled } })} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div><Label>Join threshold</Label><Input className="mt-1.5" type="number" min={3} max={100} value={config.antiRaid.joinThreshold} onChange={(e) => patch({ antiRaid: { ...config.antiRaid, joinThreshold: Number(e.target.value) } })} /></div>
          <div><Label>Window seconds</Label><Input className="mt-1.5" type="number" min={5} max={300} value={config.antiRaid.windowSeconds} onChange={(e) => patch({ antiRaid: { ...config.antiRaid, windowSeconds: Number(e.target.value) } })} /></div>
          <div><Label>Minimum age hours</Label><Input className="mt-1.5" type="number" min={0} max={8760} value={config.antiRaid.minAccountAgeHours} onChange={(e) => patch({ antiRaid: { ...config.antiRaid, minAccountAgeHours: Number(e.target.value) } })} /></div>
          <div><Label>Raid active seconds</Label><Input className="mt-1.5" type="number" min={30} max={1800} value={config.antiRaid.activeRaidSeconds} onChange={(e) => patch({ antiRaid: { ...config.antiRaid, activeRaidSeconds: Number(e.target.value) } })} /></div>
          <div><Label>Response</Label><ResponseSelect value={config.antiRaid.action} onChange={(action) => patch({ antiRaid: { ...config.antiRaid, action } })} /></div>
        </div>
      </DashboardCard>

      <DashboardCard title="Anti-nuke and recovery" description="Responds to the first destructive action when configured, neutralizes the executor and can rebuild deleted channels or roles.">
        <Toggle id="anti-nuke" label="Enable anti-nuke" description="Protects channels, roles, bans, kicks, webhooks, bot additions, permissions and server settings." checked={config.antiNuke.enabled} onChange={(enabled) => patch({ antiNuke: { ...config.antiNuke, enabled } })} />
        <Toggle id="restore-channels" label="Restore deleted channels" description="Recreates deleted channels with their cached settings and overwrites." checked={config.antiNuke.restoreDeletedChannels} onChange={(restoreDeletedChannels) => patch({ antiNuke: { ...config.antiNuke, restoreDeletedChannels } })} />
        <Toggle id="restore-roles" label="Restore deleted roles" description="Recreates deleted roles and restores their permissions where Discord allows." checked={config.antiNuke.restoreDeletedRoles} onChange={(restoreDeletedRoles) => patch({ antiNuke: { ...config.antiNuke, restoreDeletedRoles } })} />
        <Toggle id="remove-dangerous" label="Strip dangerous roles" description="Removes editable roles carrying administrator or destructive permissions." checked={config.antiNuke.removeDangerousRoles} onChange={(removeDangerousRoles) => patch({ antiNuke: { ...config.antiNuke, removeDangerousRoles } })} />
        <Toggle id="ban-bots" label="Ban malicious bots" description="Immediately bans a manageable bot identified as the attacker." checked={config.antiNuke.banMaliciousBots} onChange={(banMaliciousBots) => patch({ antiNuke: { ...config.antiNuke, banMaliciousBots } })} />
        <Toggle id="auto-lockdown" label="Lock down during neutralization" description="Closes public chat while CURSED contains a destructive incident." checked={config.antiNuke.autoLockdown} onChange={(autoLockdown) => patch({ antiNuke: { ...config.antiNuke, autoLockdown } })} />
        <Toggle id="owner-alerts" label="DM critical alerts to owner" description="Sends a direct emergency alert when a critical incident is recorded." checked={config.antiNuke.ownerAlerts} onChange={(ownerAlerts) => patch({ antiNuke: { ...config.antiNuke, ownerAlerts } })} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div><Label>Window seconds</Label><Input className="mt-1.5" type="number" min={5} max={300} value={config.antiNuke.windowSeconds} onChange={(e) => patch({ antiNuke: { ...config.antiNuke, windowSeconds: Number(e.target.value) } })} /></div>
          <div><Label>Human timeout minutes</Label><Input className="mt-1.5" type="number" min={1} max={40320} value={config.antiNuke.neutralizeTimeoutMinutes} onChange={(e) => patch({ antiNuke: { ...config.antiNuke, neutralizeTimeoutMinutes: Number(e.target.value) } })} /></div>
          <div><Label>Response</Label><ResponseSelect value={config.antiNuke.action} onChange={(action) => patch({ antiNuke: { ...config.antiNuke, action } })} /></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{thresholds.map(([key, label, max]) => <div key={key}><Label>{label}</Label><Input className="mt-1.5" type="number" min={1} max={max} value={config.antiNuke.thresholds[key]} onChange={(e) => patch({ antiNuke: { ...config.antiNuke, thresholds: { ...config.antiNuke.thresholds, [key]: Number(e.target.value) } } })} /></div>)}</div>
      </DashboardCard>

      <DashboardCard title="Message Shield" description="Stops coordinated advert floods from users and bots before regular AutoMod processing.">
        <Toggle id="message-shield" label="Enable Message Shield" description="Correlates rapid, repeated, invite, link and mass-mention messages." checked={config.messageShield.enabled} onChange={(enabled) => patch({ messageShield: { ...config.messageShield, enabled } })} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Window seconds</Label><Input className="mt-1.5" type="number" min={3} max={60} value={config.messageShield.windowSeconds} onChange={(e) => patch({ messageShield: { ...config.messageShield, windowSeconds: Number(e.target.value) } })} /></div>
          <div><Label>Repeated messages</Label><Input className="mt-1.5" type="number" min={2} max={15} value={config.messageShield.repeatedMessageThreshold} onChange={(e) => patch({ messageShield: { ...config.messageShield, repeatedMessageThreshold: Number(e.target.value) } })} /></div>
          <div><Label>Rapid messages</Label><Input className="mt-1.5" type="number" min={3} max={30} value={config.messageShield.rapidMessageThreshold} onChange={(e) => patch({ messageShield: { ...config.messageShield, rapidMessageThreshold: Number(e.target.value) } })} /></div>
          <div><Label>Bot invite posts</Label><Input className="mt-1.5" type="number" min={1} max={10} value={config.messageShield.botInviteThreshold} onChange={(e) => patch({ messageShield: { ...config.messageShield, botInviteThreshold: Number(e.target.value) } })} /></div>
          <div><Label>User invite posts</Label><Input className="mt-1.5" type="number" min={1} max={20} value={config.messageShield.inviteThreshold} onChange={(e) => patch({ messageShield: { ...config.messageShield, inviteThreshold: Number(e.target.value) } })} /></div>
          <div><Label>Links in window</Label><Input className="mt-1.5" type="number" min={1} max={30} value={config.messageShield.linkThreshold} onChange={(e) => patch({ messageShield: { ...config.messageShield, linkThreshold: Number(e.target.value) } })} /></div>
          <div><Label>Mentions per message</Label><Input className="mt-1.5" type="number" min={2} max={50} value={config.messageShield.maxMentions} onChange={(e) => patch({ messageShield: { ...config.messageShield, maxMentions: Number(e.target.value) } })} /></div>
        </div>
      </DashboardCard>

      <DashboardCard title="Quarantine and recovery" description="Saves restorable roles before isolation and restores them on release.">
        <Toggle id="quarantine-enabled" label="Enable quarantine" description="Used by anti-raid and manual quarantine commands." checked={config.quarantine.enabled} onChange={(enabled) => patch({ quarantine: { ...config.quarantine, enabled } })} />
        <Toggle id="remove-roles" label="Remove manageable roles" description="Leaves managed or higher roles untouched and records the saved role list." checked={config.quarantine.removeManageableRoles} onChange={(removeManageableRoles) => patch({ quarantine: { ...config.quarantine, removeManageableRoles } })} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>Quarantine role</Label><select className={`${selectClass} mt-1.5`} value={config.quarantine.roleId ?? "none"} onChange={(e) => patch({ quarantine: { ...config.quarantine, roleId: e.target.value === "none" ? null : e.target.value } })}><option value="none">Not configured</option>{data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}{role.editable ? "" : " (above CURSED)"}</option>)}</select></div><div><Label>Quarantine channel</Label><select className={`${selectClass} mt-1.5`} value={config.quarantine.channelId ?? "none"} onChange={(e) => patch({ quarantine: { ...config.quarantine, channelId: e.target.value === "none" ? null : e.target.value } })}><option value="none">Not configured</option>{data.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}</select></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"><Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Member Discord ID" /><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" /><Button disabled={busy || !/^\d{17,20}$/.test(userId) || !reason.trim()} onClick={() => runAction({ action: "quarantine", userId: userId.trim(), reason: reason.trim() })}>Quarantine</Button><Button variant="outline" disabled={busy || !/^\d{17,20}$/.test(userId)} onClick={() => runAction({ action: "unquarantine", userId: userId.trim(), reason: reason.trim() || undefined })}>Release</Button></div>
      </DashboardCard>

      <DashboardCard title="Emergency lockdown" description="Saves exact @everyone permission states and restores them afterward." action={<LockKeyhole className="h-5 w-5 text-crimson-bright" />}>
        <Toggle id="lockdown-enabled" label="Enable emergency lockdown" description="Allows automatic and manual lockdown." checked={config.lockdown.enabled} onChange={(enabled) => patch({ lockdown: { ...config.lockdown, enabled } })} />
        <Toggle id="raise-verification" label="Raise verification level" description="Restores the previous verification level after release." checked={config.lockdown.raiseVerificationLevel} onChange={(raiseVerificationLevel) => patch({ lockdown: { ...config.lockdown, raiseVerificationLevel } })} />
        <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{data.channels.map((channel) => <label key={channel.id} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm"><input type="checkbox" checked={config.lockdown.channelIds.includes(channel.id)} onChange={() => patch({ lockdown: { ...config.lockdown, channelIds: config.lockdown.channelIds.includes(channel.id) ? config.lockdown.channelIds.filter((id) => id !== channel.id) : [...config.lockdown.channelIds, channel.id] } })} />#{channel.name}</label>)}</div>
        <p className="mt-2 text-xs text-ash">No selected channels means all manageable text channels. Status: {data.lockdown.active ? "ACTIVE" : data.lockdown.status}.</p>
        <div className="mt-4 flex gap-2"><Button disabled={busy || data.lockdown.active || !config.lockdown.enabled || !reason.trim()} onClick={() => runAction({ action: "lockdown-enable", reason: reason.trim() })}>Enable lockdown</Button><Button variant="outline" disabled={busy || !data.lockdown.active} onClick={() => runAction({ action: "lockdown-disable", reason: reason.trim() || undefined })}>Restore server</Button></div>
      </DashboardCard>

      <DashboardCard title="Granular trusted whitelist" description="Grant only the exact protection bypass each subject needs." action={<KeyRound className="h-5 w-5 text-violet-bright" />}>
        <Toggle id="trusted-enabled" label="Enable granular trust" description="The server owner and CURSED remain implicitly trusted." checked={config.trusted.enabled} onChange={(enabled) => patch({ trusted: { ...config.trusted, enabled } })} />
        <div className="mt-4 grid gap-3 lg:grid-cols-[170px_1fr_auto]"><select className={selectClass} value={trustedType} onChange={(e) => { setTrustedType(e.target.value as TrustedSubjectType); setTrustedId("") }}><option value="user">User ID</option><option value="bot">Bot ID</option><option value="role">Role</option><option value="channel">Channel</option></select>{trustedType === "role" ? <select className={selectClass} value={trustedId} onChange={(e) => setTrustedId(e.target.value)}><option value="">Choose role</option>{data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select> : trustedType === "channel" ? <select className={selectClass} value={trustedId} onChange={(e) => setTrustedId(e.target.value)}><option value="">Choose channel</option>{data.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}</select> : <Input value={trustedId} onChange={(e) => setTrustedId(e.target.value)} placeholder="Discord ID" />}<Button variant="outline" onClick={addTrusted}><Plus className="h-4 w-4" /> Add</Button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{scopes.map(([scope, label]) => <label key={scope} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs"><input type="checkbox" checked={trustedScopes.includes(scope)} onChange={() => setTrustedScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])} />{label}</label>)}</div>
        <div className="mt-4 space-y-2">{config.trusted.entries.map((entry) => <div key={`${entry.subjectType}:${entry.subjectId}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] p-3"><div><p className="text-sm text-fog">{entry.subjectType} · {entry.subjectId}</p><p className="text-xs text-ash">{entry.scopes.join(", ")}</p></div><Button size="sm" variant="ghost" onClick={() => patch({ trusted: { ...config.trusted, entries: config.trusted.entries.filter((item) => item !== entry) } })}><Trash2 className="h-4 w-4" /> Remove</Button></div>)}</div>
      </DashboardCard>

      <div className="flex justify-end"><EditorActions dirty={dirty} saving={saving} hasErrors={!validation.success} onSave={save} onReset={reset} /></div>

      <DashboardCard title="Security incidents" description="MongoDB-backed anti-raid, anti-nuke and Message Shield detections.">
        <div className="max-h-[620px] space-y-3 overflow-y-auto">{data.incidents.map((incident) => <div key={incident.id ?? `${incident.type}:${incident.createdAt}`} className="rounded-xl border border-white/[0.08] p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold text-fog">{incident.type.replaceAll("_", " ")}</p><p className="text-xs text-ash">{incident.executorTag} · {incident.actionTaken} · {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "Unknown time"}</p></div><span className="text-xs uppercase text-ash">{incident.status} · {incident.severity}</span></div><p className="mt-3 text-sm text-fog/90">{String(incident.details.summary ?? "Suspicious activity detected.")}</p>{incident.id ? <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => updateIncident(incident.id!, { action: incident.status === "open" ? "resolve" : "reopen" })}>{incident.status === "open" ? "Resolve" : "Reopen"}</Button>{incident.status === "open" ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateIncident(incident.id!, { action: "ignore" })}>Ignore</Button> : null}</div> : null}</div>)}{!data.incidents.length ? <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-ash">No security incidents recorded.</p> : null}</div>
      </DashboardCard>
    </div>
  </div>;
}
