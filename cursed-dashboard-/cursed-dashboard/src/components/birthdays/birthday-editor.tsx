"use client";

import { useMemo, useState } from "react";
import {
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type {
  BirthdayConfig,
  BirthdayEntry,
  BirthdaysData,
  BirthdaySettingsInput,
} from "@/types/birthdays";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/[0.09] bg-black/25 px-3 py-2.5 text-sm text-fog outline-none transition placeholder:text-ash/55 focus:border-violet/50";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50";

interface BirthdayEditorProps {
  guildId: string;
  initialData: BirthdaysData;
}

function toSettings(config: BirthdayConfig): BirthdaySettingsInput {
  return {
    enabled: config.enabled,
    announcementChannelId: config.announcementChannelId,
    timezone: config.timezone,
    dmEnabled: config.dmEnabled,
    announcementEnabled: config.announcementEnabled,
    announcementTemplate: config.announcementTemplate,
    dmTemplate: config.dmTemplate,
  };
}

export function BirthdayEditor({ guildId, initialData }: BirthdayEditorProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [settings, setSettings] = useState(() => toSettings(initialData.config));
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleBirthdays = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.birthdays.filter((entry) => {
      const monthMatches = month === "all" || entry.month === Number(month);
      const searchMatches =
        !query ||
        entry.displayName.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.userId.includes(query);
      return monthMatches && searchMatches;
    });
  }, [data.birthdays, month, search]);

  function apply(next: BirthdaysData, notice: string) {
    setData(next);
    setSettings(toSettings(next.config));
    setMessage(notice);
    setError(null);
  }

  async function request(
    init: RequestInit,
    success: string
  ): Promise<BirthdaysData | null> {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/birthdays`, init);
      const payload = (await response.json()) as BirthdaysData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The birthday action failed.");
      apply(payload, success);
      return payload;
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : "The birthday action failed.";
      setError(text);
      toast({ title: "Birthday action failed", description: text, variant: "error" });
      return null;
    }
  }

  async function saveSettings() {
    setBusy("settings");
    const result = await request(
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      },
      "Birthday settings are active in the live CURSED bot."
    );
    if (result) {
      toast({
        title: "Birthday settings saved",
        description: "These settings apply only to the selected server.",
        variant: "success",
      });
    }
    setBusy(null);
  }

  async function saveBirthday() {
    if (!/^\d{17,20}$/.test(userId.trim())) {
      setError("Enter a valid Discord user ID for a current server member.");
      return;
    }
    if (!/^\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{4})?$/.test(date.trim())) {
      setError("Use DD-MM or DD-MM-YYYY, for example 24-07 or 24-07-2006.");
      return;
    }
    setBusy("birthday");
    const result = await request(
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), date: date.trim() }),
      },
      "Birthday saved for this server."
    );
    if (result) {
      setUserId("");
      setDate("");
      toast({ title: "Birthday saved", variant: "success" });
    }
    setBusy(null);
  }

  async function removeBirthday(entry: BirthdayEntry) {
    setBusy(entry.userId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/guilds/${guildId}/birthdays?userId=${encodeURIComponent(entry.userId)}`,
        { method: "DELETE" }
      );
      const payload = (await response.json()) as BirthdaysData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not remove that birthday.");
      apply(payload, `Removed ${entry.displayName}'s birthday from this server.`);
      toast({ title: "Birthday removed", variant: "success" });
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : "Could not remove that birthday.";
      setError(text);
      toast({ title: "Delete failed", description: text, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  function editBirthday(entry: BirthdayEntry) {
    setUserId(entry.userId);
    setDate(
      `${String(entry.day).padStart(2, "0")}-${String(entry.month).padStart(2, "0")}${
        entry.year ? `-${entry.year}` : ""
      }`
    );
    setMessage(`Editing ${entry.displayName}. Saving will replace the existing record.`);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet/25 bg-violet/[0.07] p-4 text-sm">
        <div className="flex items-start gap-3">
          <CakeSlice className="mt-0.5 h-5 w-5 shrink-0 text-violet-bright" />
          <div>
            <p className="font-semibold text-fog">Server-scoped birthday announcements</p>
            <p className="mt-1 leading-relaxed text-ash">
              CURSED announces only birthdays recorded in <strong className="text-fog">{data.guild.name}</strong>,
              and only in this server&apos;s selected announcement channel. Other servers never receive the announcement.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-crimson/40 bg-crimson/[0.08] px-4 py-3 text-sm text-crimson-bright">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <DashboardCard
          title="Birthday automation"
          description="Configure birthday delivery for this server."
        >
          <div className="space-y-5">
            <ToggleRow
              id="birthday-enabled"
              label="Enable birthday system"
              description="Pause the scheduler without deleting records."
              checked={settings.enabled}
              disabled={Boolean(busy)}
              onChange={(enabled) => setSettings((current) => ({ ...current, enabled }))}
            />
            <ToggleRow
              id="birthday-announcements"
              label="Server announcements"
              description="Mention the birthday member in the selected channel."
              checked={settings.announcementEnabled}
              disabled={Boolean(busy)}
              onChange={(announcementEnabled) =>
                setSettings((current) => ({ ...current, announcementEnabled }))
              }
            />
            <ToggleRow
              id="birthday-dms"
              label="Birthday DMs"
              description="Send one DM per user and birthday each year."
              checked={settings.dmEnabled}
              disabled={Boolean(busy)}
              onChange={(dmEnabled) => setSettings((current) => ({ ...current, dmEnabled }))}
            />

            <div>
              <Label htmlFor="birthday-channel">Announcement channel</Label>
              <select
                id="birthday-channel"
                value={settings.announcementChannelId ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    announcementChannelId: event.target.value || null,
                  }))
                }
                className={inputClass}
                disabled={Boolean(busy)}
              >
                <option value="">No announcement channel</option>
                {data.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>#{channel.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="birthday-timezone">Server timezone</Label>
              <input
                id="birthday-timezone"
                value={settings.timezone}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, timezone: event.target.value }))
                }
                placeholder="Asia/Kolkata"
                className={inputClass}
                disabled={Boolean(busy)}
              />
            </div>

            <TemplateField
              id="birthday-announcement-template"
              label="Announcement message"
              rows={5}
              value={settings.announcementTemplate}
              disabled={Boolean(busy)}
              onChange={(announcementTemplate) =>
                setSettings((current) => ({ ...current, announcementTemplate }))
              }
            />
            <TemplateField
              id="birthday-dm-template"
              label="DM message"
              rows={4}
              value={settings.dmTemplate}
              disabled={Boolean(busy)}
              onChange={(dmTemplate) => setSettings((current) => ({ ...current, dmTemplate }))}
            />
            <p className="text-xs text-ash">
              Variables: <code>{"{user}"}</code> <code>{"{username}"}</code> <code>{"{server}"}</code>{" "}
              <code>{"{age}"}</code> <code>{"{birthday}"}</code>
            </p>

            <button
              type="button"
              onClick={saveSettings}
              disabled={Boolean(busy)}
              className={primaryButton}
            >
              {busy === "settings" ? "Saving…" : "Save birthday settings"}
            </button>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Add or update a birthday"
          description="The Discord user must currently be in this server."
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="birthday-user">Discord user ID</Label>
              <input
                id="birthday-user"
                value={userId}
                onChange={(event) => setUserId(event.target.value.replace(/\D/g, "").slice(0, 20))}
                placeholder="123456789012345678"
                className={inputClass}
                disabled={Boolean(busy)}
              />
            </div>
            <div>
              <Label htmlFor="birthday-date">Birthday</Label>
              <input
                id="birthday-date"
                value={date}
                onChange={(event) => setDate(event.target.value.slice(0, 10))}
                placeholder="DD-MM or DD-MM-YYYY"
                className={inputClass}
                disabled={Boolean(busy)}
              />
              <p className="mt-1.5 text-xs text-ash">Birth year is optional and hidden from public bot lists.</p>
            </div>
            <button
              type="button"
              onClick={saveBirthday}
              disabled={Boolean(busy)}
              className={primaryButton}
            >
              <Plus className="h-4 w-4" /> {busy === "birthday" ? "Saving…" : "Save birthday"}
            </button>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 font-mono text-xs text-ash">
              <p>!birthday set 24-07</p>
              <p className="mt-1">!birthday set @user 24-07-2006</p>
              <p className="mt-1">!birthday list</p>
              <p className="mt-1">!birthday upcoming</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard
        title={`Saved birthdays (${data.birthdays.length})`}
        description="Everyone can view these server records using !birthday list."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or Discord ID"
              className={`${inputClass} mt-0 pl-10`}
            />
          </label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className={`${inputClass} mt-0`}
          >
            <option value="all">All months</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
        </div>

        {visibleBirthdays.length ? (
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-black/20 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Birthday</th>
                  <th className="px-4 py-3">Birth year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBirthdays.map((entry) => (
                  <tr key={entry.userId} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fog">{entry.displayName}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ash">{entry.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-fog">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-violet-bright" /> {entry.publicDate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ash">{entry.year ?? "Not provided"}</td>
                    <td className="px-4 py-3 text-ash">{entry.inGuild ? "In server" : "Member left"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editBirthday(entry)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet/30 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet/10"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBirthday(entry)}
                          disabled={busy === entry.userId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-crimson/30 px-3 py-1.5 text-xs text-crimson-bright hover:bg-crimson/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {busy === entry.userId ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.10] py-12 text-center">
            <CakeSlice className="mx-auto h-8 w-8 text-violet-bright/70" />
            <p className="mt-3 font-medium text-fog">No matching birthdays</p>
            <p className="mt-1 text-sm text-ash">Add a member above or change the filters.</p>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4 last:border-0">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-ash">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

interface TemplateFieldProps {
  id: string;
  label: string;
  rows: number;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function TemplateField({ id, label, rows, value, disabled, onChange }: TemplateFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        disabled={disabled}
      />
    </div>
  );
}
