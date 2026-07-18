"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Headphones, Plus, Send, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ServerErrorBanner } from "@/components/dashboard/editor-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  TicketCategory,
  TicketConfig,
  TicketPanel,
  TicketQuestion,
  TicketsData,
} from "@/types/tickets";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-fog outline-none focus:border-violet-bright/60";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-violet-bright/40 bg-violet-bright/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-bright/20 disabled:opacity-50";

type EditablePanel = TicketPanel | Omit<TicketPanel, "_id">;
type BooleanSetting =
  | "allowCreatorClose"
  | "requireCloseReason"
  | "transcriptOnClose"
  | "dmOnClose"
  | "feedbackEnabled";

const BOOLEAN_SETTINGS: Array<[BooleanSetting, string]> = [
  ["allowCreatorClose", "Creator can close"],
  ["requireCloseReason", "Require close reason"],
  ["transcriptOnClose", "Transcript on close"],
  ["dmOnClose", "DM when closed"],
  ["feedbackEnabled", "Request 1–5 rating"],
];

function makeQuestion(
  id: string,
  label: string,
  style: TicketQuestion["style"] = "paragraph"
): TicketQuestion {
  return {
    id,
    label,
    placeholder:
      style === "short" ? "Give staff a short summary" : "Include all relevant details",
    style,
    required: true,
  };
}

function makeCategory(
  id: string,
  label: string,
  emoji: string,
  description: string,
  priority: TicketCategory["priority"] = "normal"
): TicketCategory {
  return {
    id,
    label,
    emoji,
    description,
    priority,
    categoryId: null,
    supportRoleIds: [],
    questions: [
      makeQuestion("subject", "What do you need help with?", "short"),
      makeQuestion("details", "Explain the issue"),
    ],
  };
}

function defaultCategories(): TicketCategory[] {
  return [
    makeCategory("general", "General Support", "💬", "Questions and general help"),
    makeCategory("billing", "Billing", "💳", "Purchases and payments", "high"),
    makeCategory("report", "Report User", "🚩", "Report a member safely", "high"),
    makeCategory("appeal", "Appeals", "🛡️", "Appeal a moderation action"),
    makeCategory(
      "partnership",
      "Partnership",
      "🤝",
      "Community and business requests"
    ),
  ];
}

function defaultPanel(): Omit<TicketPanel, "_id"> {
  return {
    name: "Main Support Panel",
    title: "✦ CURSED Support Center",
    description:
      "Choose the category that best matches your request. A private support channel will be created for you.",
    color: "#8B5CF6",
    imageUrl: null,
    footer: "Powered by CURSED Support • Private • Secure",
    style: "buttons",
    channelId: null,
    messageId: null,
    categories: defaultCategories(),
    enabled: true,
  };
}

function hasPanelId(panel: EditablePanel): panel is TicketPanel {
  return "_id" in panel && typeof panel._id === "string";
}

export function TicketEditor({
  guildId,
  initialData,
}: {
  guildId: string;
  initialData: TicketsData;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<TicketsData>(initialData);
  const [config, setConfig] = useState<TicketConfig>(initialData.config);
  const [panel, setPanel] = useState<EditablePanel>(
    initialData.panels[0] ?? defaultPanel()
  );
  const [publishChannel, setPublishChannel] = useState(
    initialData.panels[0]?.channelId ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const textChannels = useMemo(
    () => data.channels.filter((channel) => channel.type === 0 || channel.type === 5),
    [data.channels]
  );
  const discordCategories = useMemo(
    () => data.channels.filter((channel) => channel.type === 4),
    [data.channels]
  );

  async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    } & T;
    if (!response.ok) throw new Error(body.error ?? "Request failed.");
    return body;
  }

  function setNumber<K extends keyof TicketConfig>(key: K, value: string) {
    setConfig((current) => ({ ...current, [key]: Number(value) }));
  }

  function toggleRole(key: "supportRoleIds" | "adminRoleIds", roleId: string) {
    setConfig((current) => {
      const roles = current[key];
      return {
        ...current,
        [key]: roles.includes(roleId)
          ? roles.filter((id) => id !== roleId)
          : [...roles, roleId],
      };
    });
  }

  function updateCategory(index: number, patch: Partial<TicketCategory>) {
    setPanel((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category
      ),
    }));
  }

  function updateQuestion(
    categoryIndex: number,
    questionIndex: number,
    patch: Partial<TicketQuestion>
  ) {
    const category = panel.categories[categoryIndex];
    if (!category) return;
    updateCategory(categoryIndex, {
      questions: category.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...patch } : question
      ),
    });
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await requestJson<TicketsData>(`/api/guilds/${guildId}/tickets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setData(next);
      setConfig(next.config);
      setSuccess("The live CURSED bot is using these ticket settings.");
      toast({
        title: "Ticket settings saved",
        description: "MongoDB and the live bot are updated.",
        variant: "success",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function savePanel() {
    setSaving(true);
    setError(null);
    try {
      const route = hasPanelId(panel)
        ? `/api/guilds/${guildId}/tickets/panels/${panel._id}`
        : `/api/guilds/${guildId}/tickets/panels`;
      await requestJson(route, {
        method: hasPanelId(panel) ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel),
      });
      toast({
        title: "Panel saved",
        description: "The CURSED panel builder is updated.",
        variant: "success",
      });
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Panel save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function publishPanel() {
    if (!hasPanelId(panel)) {
      setError("Save the panel before publishing it.");
      return;
    }
    if (!publishChannel) {
      setError("Choose a panel channel.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson(
        `/api/guilds/${guildId}/tickets/panels/${panel._id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: publishChannel }),
        }
      );
      toast({
        title: "Panel published",
        description: "The premium CURSED support panel is live in Discord.",
        variant: "success",
      });
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Publish failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePanel() {
    if (!hasPanelId(panel)) return;
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/guilds/${guildId}/tickets/panels/${panel._id}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  async function ticketAction(
    id: string,
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    setError(null);
    try {
      const next = await requestJson<TicketsData>(
        `/api/guilds/${guildId}/tickets/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        }
      );
      setData(next);
      toast({
        title: "Ticket updated",
        description: `Action: ${action}`,
        variant: "success",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ticket action failed.");
    }
  }

  const metrics: Array<[string, string | number]> = [
    ["Open tickets", data.analytics.open],
    ["Total tickets", data.analytics.total],
    [
      "Avg response",
      data.analytics.avgFirstResponseMinutes == null
        ? "—"
        : `${data.analytics.avgFirstResponseMinutes}m`,
    ],
    [
      "Rating",
      data.analytics.ratingsAverage == null
        ? "—"
        : `${data.analytics.ratingsAverage}/5`,
    ],
  ];

  return (
    <div className="space-y-6">
      <ServerErrorBanner message={error} />
      {success ? (
        <div className="flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-violet-bright/20 bg-gradient-to-br from-violet-bright/[0.09] to-black/20 p-4"
          >
            <div className="text-xs text-ash">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-fog">{value}</div>
          </div>
        ))}
      </div>

      <DashboardCard
        title="Ticket system"
        description="Private support channels, transcripts, feedback, automation, and abuse protection."
        action={<Headphones className="h-5 w-5 text-violet-bright" />}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3">
            <div>
              <Label>Enable CURSED Tickets</Label>
              <p className="text-xs text-ash">
                Keep disabled until channels and roles are ready.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) =>
                setConfig((current) => ({ ...current, enabled }))
              }
            />
          </div>

          <label>
            <Label>Ticket category</Label>
            <select
              className={inputClass}
              value={config.defaultCategoryId ?? ""}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  defaultCategoryId: event.target.value || null,
                }))
              }
            >
              <option value="">No category</option>
              {discordCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Archive category</Label>
            <select
              className={inputClass}
              value={config.archiveCategoryId ?? ""}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  archiveCategoryId: event.target.value || null,
                }))
              }
            >
              <option value="">Keep in place</option>
              {discordCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Ticket log channel</Label>
            <select
              className={inputClass}
              value={config.logChannelId ?? ""}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  logChannelId: event.target.value || null,
                }))
              }
            >
              <option value="">Disabled</option>
              {textChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Transcript channel</Label>
            <select
              className={inputClass}
              value={config.transcriptChannelId ?? ""}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  transcriptChannelId: event.target.value || null,
                }))
              }
            >
              <option value="">Use ticket channel</option>
              {textChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Max open per user</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              max={10}
              value={config.maxOpenPerUser}
              onChange={(event) => setNumber("maxOpenPerUser", event.target.value)}
            />
          </label>
          <label>
            <Label>New-ticket cooldown (minutes)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={config.cooldownMinutes}
              onChange={(event) => setNumber("cooldownMinutes", event.target.value)}
            />
          </label>
          <label>
            <Label>Auto-close inactive (hours)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={config.autoCloseHours}
              onChange={(event) => setNumber("autoCloseHours", event.target.value)}
            />
          </label>
          <label>
            <Label>First-response SLA (minutes)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={config.firstResponseSlaMinutes}
              onChange={(event) =>
                setNumber("firstResponseSlaMinutes", event.target.value)
              }
            />
          </label>
          <label>
            <Label>Delete after close (minutes)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={config.deleteAfterCloseMinutes}
              onChange={(event) =>
                setNumber("deleteAfterCloseMinutes", event.target.value)
              }
            />
          </label>
          <label>
            <Label>Default priority</Label>
            <select
              className={inputClass}
              value={config.defaultPriority}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  defaultPriority: event.target.value as TicketConfig["defaultPriority"],
                }))
              }
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>
            <Label>Channel naming</Label>
            <Input
              className="mt-1.5"
              value={config.namingTemplate}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  namingTemplate: event.target.value,
                }))
              }
            />
            <p className="mt-1 text-xs text-ash">
              Use {"{number}"}, {"{user}"}, and {"{category}"}.
            </p>
          </label>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOOLEAN_SETTINGS.map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-2"
            >
              <span className="text-sm text-fog">{label}</span>
              <Switch
                checked={config[key]}
                onCheckedChange={(value) =>
                  setConfig((current) => ({ ...current, [key]: value }))
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Support roles</Label>
            <div className="mt-2 grid max-h-44 gap-2 overflow-auto rounded-lg border border-white/[0.08] p-3">
              {data.roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-fog">
                  <input
                    type="checkbox"
                    checked={config.supportRoleIds.includes(role.id)}
                    onChange={() => toggleRole("supportRoleIds", role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Ticket admin roles</Label>
            <div className="mt-2 grid max-h-44 gap-2 overflow-auto rounded-lg border border-white/[0.08] p-3">
              {data.roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-fog">
                  <input
                    type="checkbox"
                    checked={config.adminRoleIds.includes(role.id)}
                    onChange={() => toggleRole("adminRoleIds", role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-5 block">
          <Label>Blacklisted user IDs</Label>
          <Textarea
            className="mt-1.5"
            value={config.blacklistUserIds.join("\n")}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                blacklistUserIds: event.target.value
                  .split(/\s+/)
                  .map((value) => value.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="One Discord user ID per line"
          />
        </label>

        <div className="mt-5 flex justify-end">
          <button className={buttonClass} onClick={saveSettings} disabled={saving}>
            Save ticket settings
          </button>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Premium panel builder"
        description="Dark-purple CURSED panel with category routing and modal questions."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <Label>Panel name</Label>
            <Input
              className="mt-1.5"
              value={panel.name}
              onChange={(event) =>
                setPanel((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            <Label>Embed title</Label>
            <Input
              className="mt-1.5"
              value={panel.title}
              onChange={(event) =>
                setPanel((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              className="mt-1.5"
              value={panel.description}
              onChange={(event) =>
                setPanel((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <Label>Accent color</Label>
            <Input
              className="mt-1.5"
              type="color"
              value={panel.color}
              onChange={(event) =>
                setPanel((current) => ({ ...current, color: event.target.value }))
              }
            />
          </label>
          <label>
            <Label>Panel controls</Label>
            <select
              className={inputClass}
              value={panel.style}
              onChange={(event) =>
                setPanel((current) => ({
                  ...current,
                  style: event.target.value as TicketPanel["style"],
                }))
              }
            >
              <option value="buttons">Buttons (up to 5)</option>
              <option value="select">Dropdown (up to 25)</option>
            </select>
          </label>
          <label>
            <Label>Banner image URL</Label>
            <Input
              className="mt-1.5"
              value={panel.imageUrl ?? ""}
              onChange={(event) =>
                setPanel((current) => ({
                  ...current,
                  imageUrl: event.target.value || null,
                }))
              }
            />
          </label>
          <label>
            <Label>Footer</Label>
            <Input
              className="mt-1.5"
              value={panel.footer}
              onChange={(event) =>
                setPanel((current) => ({ ...current, footer: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {panel.categories.map((category, categoryIndex) => (
            <div
              key={`${category.id}-${categoryIndex}`}
              className="rounded-xl border border-violet-bright/15 bg-violet-bright/[0.03] p-3"
            >
              <div className="grid gap-2 md:grid-cols-5">
                <Input
                  value={category.emoji}
                  onChange={(event) =>
                    updateCategory(categoryIndex, { emoji: event.target.value })
                  }
                />
                <Input
                  className="md:col-span-2"
                  value={category.label}
                  onChange={(event) =>
                    updateCategory(categoryIndex, {
                      label: event.target.value,
                      id: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                />
                <select
                  className={inputClass.replace("mt-1.5 ", "")}
                  value={category.priority}
                  onChange={(event) =>
                    updateCategory(categoryIndex, {
                      priority: event.target.value as TicketCategory["priority"],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  className="rounded-lg border border-red-400/30 text-red-300"
                  onClick={() =>
                    setPanel((current) => ({
                      ...current,
                      categories: current.categories.filter(
                        (_, index) => index !== categoryIndex
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
              <Input
                className="mt-2"
                value={category.description ?? ""}
                onChange={(event) =>
                  updateCategory(categoryIndex, {
                    description: event.target.value,
                  })
                }
              />
              <select
                className={inputClass}
                value={category.categoryId ?? ""}
                onChange={(event) =>
                  updateCategory(categoryIndex, {
                    categoryId: event.target.value || null,
                  })
                }
              >
                <option value="">Default ticket category</option>
                {discordCategories.map((discordCategory) => (
                  <option key={discordCategory.id} value={discordCategory.id}>
                    {discordCategory.name}
                  </option>
                ))}
              </select>

              <div className="mt-3 space-y-2 border-t border-white/[0.07] pt-3">
                <div className="text-xs font-medium uppercase tracking-wide text-ash">
                  Opening questions
                </div>
                {category.questions.map((question, questionIndex) => (
                  <div
                    key={`${question.id}-${questionIndex}`}
                    className="grid gap-2 md:grid-cols-[1fr_150px_auto]"
                  >
                    <Input
                      value={question.label}
                      onChange={(event) =>
                        updateQuestion(categoryIndex, questionIndex, {
                          label: event.target.value,
                          id: `question-${questionIndex + 1}`,
                        })
                      }
                    />
                    <select
                      className={inputClass.replace("mt-1.5 ", "")}
                      value={question.style}
                      onChange={(event) =>
                        updateQuestion(categoryIndex, questionIndex, {
                          style: event.target.value as TicketQuestion["style"],
                        })
                      }
                    >
                      <option value="short">Short</option>
                      <option value="paragraph">Paragraph</option>
                    </select>
                    <button
                      className="rounded-lg border border-red-400/30 px-3 text-xs text-red-300"
                      onClick={() =>
                        updateCategory(categoryIndex, {
                          questions: category.questions.filter(
                            (_, index) => index !== questionIndex
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {category.questions.length < 5 ? (
                  <button
                    className={buttonClass}
                    onClick={() =>
                      updateCategory(categoryIndex, {
                        questions: [
                          ...category.questions,
                          makeQuestion(
                            `question-${category.questions.length + 1}`,
                            "New question"
                          ),
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add question
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={buttonClass}
            onClick={() =>
              setPanel((current) => ({
                ...current,
                categories: [
                  ...current.categories,
                  makeCategory(
                    `category-${current.categories.length + 1}`,
                    "New Category",
                    "🎫",
                    "Describe this department"
                  ),
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
          <button className={buttonClass} onClick={savePanel} disabled={saving}>
            Save panel
          </button>
          {hasPanelId(panel) ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300"
              onClick={deletePanel}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" /> Delete panel
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-white/[0.08] p-4 sm:flex-row">
          <select
            className={inputClass.replace("mt-1.5 ", "")}
            value={publishChannel}
            onChange={(event) => setPublishChannel(event.target.value)}
          >
            <option value="">Choose panel channel</option>
            {textChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
          <button className={buttonClass} onClick={publishPanel} disabled={saving}>
            <Send className="h-4 w-4" /> Publish to Discord
          </button>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Live ticket queue"
        description="Review ticket state, priority, ownership, and recovery actions."
      >
        <div className="space-y-2">
          {data.tickets.length ? (
            data.tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="font-medium text-fog">
                    #{ticket.ticketNumber} • {ticket.categoryLabel}
                  </div>
                  <div className="text-xs text-ash">
                    {ticket.creatorTag} • {ticket.status} • {ticket.priority}
                    {ticket.claimedByTag ? ` • ${ticket.claimedByTag}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5 text-xs"
                    value={ticket.priority}
                    onChange={(event) =>
                      ticketAction(ticket._id, "priority", {
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {ticket.status === "closed" ? (
                    <button
                      className={buttonClass}
                      onClick={() => ticketAction(ticket._id, "reopen")}
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      className={buttonClass}
                      onClick={() =>
                        ticketAction(ticket._id, "close", {
                          reason: "Closed from CURSED dashboard",
                        })
                      }
                    >
                      Close
                    </button>
                  )}
                  <button
                    className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300"
                    onClick={() => ticketAction(ticket._id, "delete")}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ash">
              No tickets yet. Publish the panel to begin.
            </p>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
