"use client";

import { useMemo, useState } from "react";
import {
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Send,
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
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

interface BirthdayEditorProps {
  guildId: string;
  initialData: BirthdaysData;
}

function settingsFrom(config: BirthdayConfig): BirthdaySettingsInput {
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
  const [settings, setSettings] = useState(() => settingsFrom(initialData.config));
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredBirthdays = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.birthdays.filter((entry) => {
      const matchesMonth = month === "all" || entry.month === Number(month);
      const matchesSearch =
        !query ||
        entry.displayName.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.userId.includes(query);
      return matchesMonth && matchesSearch;
    });
  }, [data.birthdays, month, search]);

  function applyData(next: BirthdaysData, successMessage?: string) {
    setData(next);
    setSettings(settingsFrom(next.config));
    setError(null);
    setNotice(successMessage ?? null);
  }

  async function saveSettings() {
    setSavingSettings(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/birthdays`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as BirthdaysData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Couldn't save birthday settings.");
      applyData(payload, "Birthday settings are active in the live CURSED bot.");
      toast({
        title: "Birthday settings saved",
        description: "The scheduler will use these settings for this server only.",
        variant: "success",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Couldn't save birthday settings.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveBirthday() {
    if (!/^\d{17,20}$/.test(userId.trim())) {
      setError("Enter the Discord user ID of a current member in this server.");
      return;
    }
    if (!/^\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{4})?$/.test(date.trim())) {
      setError("Use DD-MM or DD-MM-YYYY, for example 24-07 or 24-07-2006.");
      return;
    }
    setSavingBirthday(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/birthdays`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), date: date.trim() }),
      });
      const payload = (await response.json()) as BirthdaysData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Couldn't save that birthday.");
      applyData(payload, "Birthday saved for this server.");
      setUserId("");
      setDate("");
      toast({
        title: "Birthday saved",
        description: "The record is available through the dashboard and !birthday commands.",
        variant: "success",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Couldn't save that birthday.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSavingBirthday(false);
    }
  }

  async function deleteBirthday(entry: BirthdayEntry) {
    setDeletingUserId(entry.userId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/guilds/${guildId}/birthdays?userId=${encodeURIComponent(entry.userId)}`,
        { method: "DELETE" }
      );
      const payload = (await response.json()) as BirthdaysData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Couldn't remove that birthday.");
      applyData(payload, `Removed ${entry.displayName}'s birthday from this server.`);
      toast({ title: "Birthday removed", variant: "success" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Couldn't remove that birthday.";
      setError(message);
      toast({ title: "Delete failed", description: message, variant: "error" });
    } finally {
      setDeletingUserId(null);
    }
  }

  function editBirthday(entry: BirthdayEntry) {
    setUserId(entry.userId);
    setDate(
      `${String(entry.day).padStart(2, "0")}-${String(entry.month).padStart(2, "0")}${
        entry.year ? `-${entry.year}` : ""
      }`
    );
    setError(null);
    setNotice(`Editing ${entry.displayName}. Save to replace their current record.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet/25 bg-violet/[0.07] p-4 text-sm text-violet-100">
        <div className="flex items-start gap-3">
          <CakeSlice className="mt-0.5 h-5 w-5 shrink-0 text-violet-bright" />
          <div>
            <div className="font-semibold">Server-scoped birthday announcements</div>
            <p className="mt-1 leading-relaxed text-ash">
              CURSED announces only birthdays recorded in <strong className="text-fog">{data.guild.name}</strong>,
              and only in the announcement channel selected below. Other servers do not receive this announcement.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-crimson/40 bg-crimson/[0.08] px-4 py-3 text-sm text-crimson-bright">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DashboardCard
          title="Birthday automation"
          description="Choose where and when CURSED sends birthday messages for this server."
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="birthday-enabled">Enable birthday system</Label>
                <p className="mt-1 text-xs text-ash">Stops the scheduler without deleting saved birthdays.</p>
              </div>
              <Switch
                id="birthday-enabled"
                checked={settings.enabled}
                onCheckedChange={(enabled) => setSettings((current) => ({ ...current, enabled }))}
                disabled={savingSettings}
              />
            </div>

            <div className="border-t border-white/[0.06] pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="birthday-announcements">Server announcements</Label>
                  <p className="mt-1 text-xs text-ash">Mention the member in this server's selected channel.</p>
                </div>
                <Switch
                  id="birthday-announcements"
                  checked={settings.announcementEnabled}
                  onCheckedChange={(announcementEnabled) =>
                    setSettings((current) => ({ ...current, announcementEnabled }))
                  }
                  disabled={savingSettings}
                />
              </div>

              <Label htmlFor="birthday-channel" className="mt-4 block">Announcement channel</Label>
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
                disabled={savingSettings}
              >
                <option value="">No announcement channel</option>
                {data.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>#{channel.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  disabled={savingSettings}
                />
              </div>
              <div className="flex items-end">
                <div className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5">
                  <div>
                    <Label htmlFor="birthday-dm">Birthday DMs</Label>
                    <p className="mt-0.5 text-[11px] text-ash">One DM per user and birthday.</p>
                  </div>
                  <Switch
                    id="birthday-dm"
                    checked={settings.dmEnabled}
                    onCheckedChange={(dmEnabled) => setSettings((current) => ({ ...current, dmEnabled }))}
                    disabled={savingSettings}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="birthday-announcement-template">Announcement message</Label>
              <textarea
                id="birthday-announcement-template"
                rows={5}
                value={settings.announcementTemplate}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, announcementTemplate: event.target.value }))
                }
                className={inputClass}
                disabled={savingSettings}
              />
            </div>

            <div>
              <Label htmlFor="birthday-dm-template">DM message</Label>
              <textarea
                id="birthday-dm-template"
                rows={4}
                value={settings.dmTemplate}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, dmTemplate: event.target.value }))
                }
                className={inputClass}
                disabled={savingSettings}
              />
              <p className="mt-2 text-xs text-ash">
                Variables: <code>{"{user}"}</code> <code>{"{username}"}</code> <code>{"{server}"}</code>{" "}
                <code>{"{age}"}</code> <code>{"{birthday}"}</code>
              </p>
            </div>

            <button
              type="button"
              onClick={saveSettings}
              disabled={savingSettings}
              className={`${buttonClass} bg-violet-500 text-white hover:bg-violet-400`}
            >
              <Megaphone className="h-4 w-4" />
              {savingSettings ? "Saving…" : "Save birthday settings"}
            </button>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Add or update a birthday"
          description="The Discord user must currently be a member of this server."
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="birthday-user-id">Discord user ID</Label>
              <input
                id="birthday-user-id"
                value={userId}
                onChange={(event) => setUserId(event.target.value.replace(/\D/g, "").slice(0, 20))}
                placeholder="123456789012345678"
                className={inputClass}
                disabled={savingBirthday}
              />
              <p className="mt-1.5 text-xs text-ash">
                In Discord Developer Mode, right-click the member and choose Copy User ID.
              </p>
            </div>
            <div>
              <Label htmlFor="birthday-date">Birthday</Label>
              <input
                id="birthday-date"
                value={date}
                onChange={(event) => setDate(event.target.value.slice(0, 10))}
                placeholder="DD-MM or DD-MM-YYYY"
                className={inputClass}
                disabled={savingBirthday}
              />
              <p className="mt-1.5 text-xs text-ash">The birth year is optional. Public bot lists hide it.</p>
            </div>
            <button
              type="button"
              onClick={saveBirthday}
              disabled={savingBirthday}
              className={`${buttonClass} bg-emerald-500 text-black hover:bg-emerald-400`}
            >
              <Plus className="h-4 w-4" />
              {savingBirthday ? "Saving…" : "Save birthday"}
            </button>

            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm text-ash">
              <div className="flex items-center gap-2 font-medium text-fog">
                <Send className="h-4 w-4 text-violet-bright" /> Prefix commands also work
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs">
                <div>!birthday set 24-07</div>
                <div>!birthday set @user 24-07-2006</div>
                <div>!birthday list</div>
                <div>!birthday upcoming</div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard
        title={`Saved birthdays (${data.birthdays.length})`}
        description="These records belong only to the selected server. Everyone can view them through !birthday list."
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
          <select value={month} onChange={(event) => setMonth(event.target.value)} className={`${inputClass} mt-0`}>
            <option value="all">All months</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
        </div>

        {filteredBirthdays.length ? (
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[720px] text-left text-sm">
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
                {filteredBirthdays.map((entry) => (
                  <tr key={entry.userId} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-fog">{entry.displayName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-ash">{entry.userId}</div>
                    </td>
                    <td className="px-4 py-3 text-fog">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-violet-bright" /> {entry.publicDate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ash">{entry.year ?? "Not provided"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          entry.inGuild
                            ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200"
                            : "border-amber-400/30 bg-amber-400/[0.08] text-amber-200"
                        }`}
                      >
                        {entry.inGuild ? "In server" : "Member left"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editBirthday(entry)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet/30 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-violet/10"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBirthday(entry)}
                          disabled={deletingUserId === entry.userId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-crimson/30 px-3 py-1.5 text-xs text-crimson-bright transition hover:bg-crimson/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingUserId === entry.userId ? "Removing…" : "Remove"}
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
            <div className="mt-3 font-medium text-fog">No matching birthdays</div>
            <p className="mt-1 text-sm text-ash">Add a member above or change the search filters.</p>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
