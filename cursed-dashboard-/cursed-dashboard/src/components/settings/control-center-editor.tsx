"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Coins,
  Crown,
  Gamepad2,
  ImageIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { controlCenterSaveSchema } from "@/lib/validation/control-center";
import type {
  ControlCenterConfig,
  ControlCenterData,
  ControlCenterSavePayload,
  DashboardLevelingConfig,
} from "@/types/control-center";

interface ControlCenterEditorProps {
  guildId: string;
  initialData: ControlCenterData;
}

interface EditorState {
  config: ControlCenterConfig;
  leveling: DashboardLevelingConfig;
}

const selectClass =
  "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none transition-colors focus:border-violet/60 focus:ring-1 focus:ring-violet/60 disabled:cursor-not-allowed disabled:opacity-50";

function cloneState(state: EditorState): EditorState {
  return JSON.parse(JSON.stringify(state)) as EditorState;
}

function savePayload(state: EditorState): ControlCenterSavePayload {
  return {
    config: {
      ...state.config,
      aiCustomPrompt: state.config.aiCustomPrompt?.trim() || null,
      linkWhitelist: state.config.linkWhitelist
        .map((domain) => domain.trim())
        .filter(Boolean),
      paymentLinks: {
        kofi: state.config.paymentLinks.kofi?.trim() || null,
        patreon: state.config.paymentLinks.patreon?.trim() || null,
        bmc: state.config.paymentLinks.bmc?.trim() || null,
      },
    },
    leveling: {
      enabled: state.leveling.enabled,
      levelUpChannelId: state.leveling.levelUpChannelId,
      ignoredChannelIds: state.leveling.ignoredChannelIds,
      xpMin: state.leveling.xpMin,
      xpMax: state.leveling.xpMax,
      cooldownSeconds: state.leveling.cooldownSeconds,
      announceLevelUps: state.leveling.announceLevelUps,
    },
  };
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-ash">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function MultiChannelPicker({
  channels,
  selected,
  onToggle,
  disabled = false,
}: {
  channels: ControlCenterData["channels"];
  selected: string[];
  onToggle: (channelId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
      {channels.map((channel) => {
        const checked = selected.includes(channel.id);
        return (
          <label
            key={channel.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-fog transition-colors hover:border-violet/40"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(channel.id)}
              disabled={disabled}
              className="h-4 w-4 accent-violet"
            />
            <span className="truncate">#{channel.name}</span>
            {!channel.canSend ? (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-300">
                read only
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

export function ControlCenterEditor({ guildId, initialData }: ControlCenterEditorProps) {
  const { toast } = useToast();
  const initialState = useMemo<EditorState>(
    () => ({ config: initialData.config, leveling: initialData.leveling }),
    [initialData.config, initialData.leveling]
  );
  const [saved, setSaved] = useState(() => cloneState(initialState));
  const [state, setState] = useState(() => cloneState(initialState));
  const [stats, setStats] = useState(initialData.levelingStats);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [commandSearch, setCommandSearch] = useState("");

  const payload = useMemo(() => savePayload(state), [state]);
  const validation = useMemo(() => controlCenterSaveSchema.safeParse(payload), [payload]);
  const hasErrors = !validation.success;
  const dirty = JSON.stringify(savePayload(saved)) !== JSON.stringify(payload);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patchConfig = useCallback((patch: Partial<ControlCenterConfig>) => {
    setState((previous) => ({
      ...previous,
      config: { ...previous.config, ...patch },
    }));
    setServerError(null);
    setSuccess(null);
  }, []);

  const patchLeveling = useCallback((patch: Partial<DashboardLevelingConfig>) => {
    setState((previous) => ({
      ...previous,
      leveling: { ...previous.leveling, ...patch },
    }));
    setServerError(null);
    setSuccess(null);
  }, []);

  const toggleArrayValue = useCallback((values: string[], value: string) => {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }, []);

  const handleReset = useCallback(() => {
    setState(cloneState(saved));
    setServerError(null);
    setSuccess(null);
  }, [saved]);

  const handleSave = useCallback(async () => {
    const parsed = controlCenterSaveSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Some settings are invalid.";
      setServerError(first);
      toast({ title: "Fix the highlighted settings", description: first, variant: "error" });
      return;
    }

    setSaving(true);
    setServerError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/control-center`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error ?? "Couldn't save control center settings.";
        const fieldMessage = Object.values(data?.fieldErrors ?? {})
          .flat()
          .find((value): value is string => typeof value === "string");
        setServerError(fieldMessage ?? message);
        toast({ title: "Save failed", description: fieldMessage ?? message, variant: "error" });
        return;
      }

      const next: EditorState = {
        config: data.config,
        leveling: data.leveling,
      };
      setState(cloneState(next));
      setSaved(cloneState(next));
      if (data.levelingStats) setStats(data.levelingStats);
      setSuccess("The live Railway bot is now using these settings.");
      toast({
        title: "Control center saved",
        description: "Changes are active in CURSED.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the dashboard API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [guildId, payload, toast]);

  const visibleCommands = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) return initialData.commands;
    return initialData.commands.filter(
      (command) =>
        command.name.includes(query) ||
        command.description.toLowerCase().includes(query) ||
        command.category.toLowerCase().includes(query)
    );
  }, [commandSearch, initialData.commands]);

  const validationMessage = validation.success
    ? null
    : validation.error.issues[0]?.message ?? "Some settings are invalid.";

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
        {[
          [Bot, "AI", state.config.aiEnabled ? "Enabled" : "Disabled"],
          [Star, "Leveling", state.leveling.enabled ? "Enabled" : "Disabled"],
          [Coins, "XP members", stats.available ? stats.members.toLocaleString() : "—"],
          [Gamepad2, "Modules enabled", String(initialData.modules.length - state.config.disabledModules.length)],
          [Sparkles, "Providers", String(Object.values(initialData.aiProviders).filter(Boolean).length)],
        ].map(([Icon, label, value]) => {
          const CardIcon = Icon as typeof Bot;
          return (
            <div key={String(label)} className="glass rounded-xl p-4">
              <CardIcon className="mb-2 h-4 w-4 text-violet-bright" />
              <p className="text-[11px] uppercase tracking-wide text-ash">{String(label)}</p>
              <p className="mt-1 font-display text-lg font-semibold text-fog">{String(value)}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <DashboardCard
          title="AI chat and memory"
          description="Controls the live mention/reply AI path without exposing provider keys."
          action={<Bot className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ToggleRow
                id="ai-enabled"
                label="Enable AI chat"
                description="Allow CURSED to answer mentions and replies."
                checked={state.config.aiEnabled}
                onChange={(checked) => patchConfig({ aiEnabled: checked })}
              />
              <ToggleRow
                id="ai-memory"
                label="Short-term conversation memory"
                description="Include recent messages in the next AI request."
                checked={state.config.aiMemoryEnabled}
                onChange={(checked) => patchConfig({ aiMemoryEnabled: checked })}
              />
              <ToggleRow
                id="ai-long-memory"
                label="Long-term memory"
                description="Read and extract durable user memories."
                checked={state.config.aiLongTermMemoryEnabled}
                onChange={(checked) => patchConfig({ aiLongTermMemoryEnabled: checked })}
              />
              <ToggleRow
                id="legacy-xp"
                label="Legacy economy XP from AI chat"
                description="Keep economy XP boosts and quest compatibility alongside server leveling."
                checked={state.config.legacyEconomyXpEnabled}
                onChange={(checked) => patchConfig({ legacyEconomyXpEnabled: checked })}
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="ai-max-tokens">Max tokens</Label>
                  <Input
                    id="ai-max-tokens"
                    type="number"
                    min={100}
                    max={1500}
                    value={state.config.aiMaxTokens}
                    onChange={(event) => patchConfig({ aiMaxTokens: Number(event.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-rate-limit">Requests</Label>
                  <Input
                    id="ai-rate-limit"
                    type="number"
                    min={1}
                    max={30}
                    value={state.config.aiRateLimit}
                    onChange={(event) => patchConfig({ aiRateLimit: Number(event.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-rate-window">Window (sec)</Label>
                  <Input
                    id="ai-rate-window"
                    type="number"
                    min={10}
                    max={600}
                    value={state.config.aiRateWindowSeconds}
                    onChange={(event) =>
                      patchConfig({ aiRateWindowSeconds: Number(event.target.value) })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ai-custom-prompt">Server-specific AI instruction</Label>
                <Textarea
                  id="ai-custom-prompt"
                  className="mt-1.5"
                  rows={6}
                  maxLength={2000}
                  value={state.config.aiCustomPrompt ?? ""}
                  onChange={(event) =>
                    patchConfig({ aiCustomPrompt: event.target.value || null })
                  }
                  placeholder="Example: Be concise, helpful, English-only, and avoid pinging roles."
                />
                <p className="mt-1 text-right text-xs text-ash">
                  {state.config.aiCustomPrompt?.length ?? 0}/2000
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-ash">
                Gemini: {initialData.aiProviders.gemini ? "configured" : "unavailable"} · Groq:{" "}
                {initialData.aiProviders.groq ? "configured" : "unavailable"} · OpenRouter:{" "}
                {initialData.aiProviders.openRouter ? "configured" : "unavailable"}
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Channel access"
          description="Restrict all prefix commands and AI chat to selected channels."
        >
          <ToggleRow
            id="channel-restriction"
            label="Enable channel restriction"
            description="Admin recovery commands remain available even if the allow-list is empty."
            checked={state.config.channelRestrictionEnabled}
            onChange={(checked) => patchConfig({ channelRestrictionEnabled: checked })}
          />
          <div className="mt-4">
            <MultiChannelPicker
              channels={initialData.channels}
              selected={state.config.allowedChannels}
              disabled={!state.config.channelRestrictionEnabled}
              onToggle={(channelId) =>
                patchConfig({
                  allowedChannels: toggleArrayValue(state.config.allowedChannels, channelId),
                })
              }
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Feature modules"
          description="Enable or disable entire command systems. Help and channel recovery commands cannot be disabled."
          action={<Gamepad2 className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {initialData.modules.map((module) => {
              const enabled = !state.config.disabledModules.includes(module.key);
              const icon = module.key === "images" ? ImageIcon : module.key.includes("economy") ? Coins : Gamepad2;
              const ModuleIcon = icon;
              return (
                <div key={module.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <ModuleIcon className="mb-2 h-4 w-4 text-violet-bright" />
                      <p className="text-sm font-medium text-fog">{module.label}</p>
                      <p className="mt-1 text-xs text-ash">{module.description}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        patchConfig({
                          disabledModules: checked
                            ? state.config.disabledModules.filter((key) => key !== module.key)
                            : [...state.config.disabledModules, module.key],
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Individual commands"
          description="Disable exact commands while leaving the rest of their module active."
          action={<Search className="h-5 w-5 text-violet-bright" />}
        >
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ash" />
            <Input
              value={commandSearch}
              onChange={(event) => setCommandSearch(event.target.value)}
              placeholder="Search commands or categories..."
              className="pl-9"
            />
          </div>
          <div className="grid max-h-[34rem] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {visibleCommands.map((command) => {
              const enabled = !state.config.disabledCommands.includes(command.name);
              return (
                <div
                  key={`${command.categoryKey}:${command.name}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-fog">{command.name}</p>
                    <p className="truncate text-[11px] text-ash">{command.description}</p>
                  </div>
                  <Switch
                    checked={command.protected ? true : enabled}
                    disabled={command.protected}
                    onCheckedChange={(checked) =>
                      patchConfig({
                        disabledCommands: checked
                          ? state.config.disabledCommands.filter((name) => name !== command.name)
                          : [...state.config.disabledCommands, command.name],
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Moderation and protection"
          description="Controls the existing anti-spam, anti-link, anti-invite, mod-log, and slash moderation paths."
          action={<ShieldCheck className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ToggleRow
                id="moderation-commands"
                label="Moderation slash commands"
                description="Warn, timeout, kick, ban, welcome, and autorole setup commands."
                checked={state.config.moderationCommandsEnabled}
                onChange={(checked) => patchConfig({ moderationCommandsEnabled: checked })}
              />
              <ToggleRow
                id="anti-spam"
                label="Anti-spam"
                description="Delete rapid floods and apply a temporary timeout."
                checked={state.config.antiSpam}
                onChange={(checked) => patchConfig({ antiSpam: checked })}
              />
              <ToggleRow
                id="anti-link"
                label="Anti-link"
                description="Remove links except whitelisted domains."
                checked={state.config.antiLink}
                onChange={(checked) => patchConfig({ antiLink: checked })}
              />
              <ToggleRow
                id="anti-invite"
                label="Anti-invite"
                description="Remove Discord invitation links."
                checked={state.config.antiInvite}
                onChange={(checked) => patchConfig({ antiInvite: checked })}
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mod-log-channel">Moderation log channel</Label>
                <select
                  id="mod-log-channel"
                  className={`${selectClass} mt-1.5`}
                  value={state.config.modLogChannelId ?? ""}
                  onChange={(event) =>
                    patchConfig({ modLogChannelId: event.target.value || null })
                  }
                >
                  <option value="">No log channel</option>
                  {initialData.channels
                    .filter((channel) => channel.canSend)
                    .map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="link-whitelist">Allowed link domains</Label>
                <Textarea
                  id="link-whitelist"
                  className="mt-1.5"
                  rows={6}
                  value={state.config.linkWhitelist.join("\n")}
                  onChange={(event) =>
                    patchConfig({
                      linkWhitelist: event.target.value
                        .split(/[\n,]/)
                        .map((value) => value.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"youtube.com\ngithub.com\nyour-site.com"}
                />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Arcane-style server leveling"
          description="Live MongoDB XP settings used by /rank, /levels, and level-up cards."
          action={<Star className="h-5 w-5 text-violet-bright" />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ToggleRow
                id="leveling-enabled"
                label="Enable server leveling"
                description="Pause or resume without deleting member XP."
                checked={state.leveling.enabled}
                onChange={(checked) => patchLeveling({ enabled: checked })}
              />
              <ToggleRow
                id="leveling-announcements"
                label="Level-up announcements"
                description="Send the working level card when a member reaches a new level."
                checked={state.leveling.announceLevelUps}
                onChange={(checked) => patchLeveling({ announceLevelUps: checked })}
              />
              <div className="mt-4">
                <Label htmlFor="level-channel">Level-up channel</Label>
                <select
                  id="level-channel"
                  className={`${selectClass} mt-1.5`}
                  value={state.leveling.levelUpChannelId ?? ""}
                  onChange={(event) =>
                    patchLeveling({ levelUpChannelId: event.target.value || null })
                  }
                >
                  <option value="">Select a channel</option>
                  {initialData.channels
                    .filter((channel) => channel.canSend)
                    .map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="xp-min">XP min</Label>
                  <Input
                    id="xp-min"
                    type="number"
                    min={1}
                    max={1000}
                    className="mt-1.5"
                    value={state.leveling.xpMin}
                    onChange={(event) => patchLeveling({ xpMin: Number(event.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="xp-max">XP max</Label>
                  <Input
                    id="xp-max"
                    type="number"
                    min={1}
                    max={1000}
                    className="mt-1.5"
                    value={state.leveling.xpMax}
                    onChange={(event) => patchLeveling({ xpMax: Number(event.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="xp-cooldown">Cooldown</Label>
                  <Input
                    id="xp-cooldown"
                    type="number"
                    min={5}
                    max={3600}
                    className="mt-1.5"
                    value={state.leveling.cooldownSeconds}
                    onChange={(event) =>
                      patchLeveling({ cooldownSeconds: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Ignored XP channels</Label>
              <p className="mb-3 mt-1 text-xs text-ash">
                Messages in these channels never earn server XP.
              </p>
              <MultiChannelPicker
                channels={initialData.channels}
                selected={state.leveling.ignoredChannelIds}
                onToggle={(channelId) =>
                  patchLeveling({
                    ignoredChannelIds: toggleArrayValue(
                      state.leveling.ignoredChannelIds,
                      channelId
                    ),
                  })
                }
              />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className="text-lg font-semibold text-fog">{stats.members.toLocaleString()}</p>
                  <p className="text-[10px] uppercase text-ash">Members</p>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className="text-lg font-semibold text-fog">{stats.totalXp.toLocaleString()}</p>
                  <p className="text-[10px] uppercase text-ash">Total XP</p>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className="text-lg font-semibold text-fog">{stats.totalMessages.toLocaleString()}</p>
                  <p className="text-[10px] uppercase text-ash">XP messages</p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Premium configuration"
          description="Role and payment links used by the existing supporter commands and webhook grants."
          action={<Crown className="h-5 w-5 text-amber-300" />}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="premium-role">Premium role</Label>
              <select
                id="premium-role"
                className={`${selectClass} mt-1.5`}
                value={state.config.premiumRoleId ?? ""}
                onChange={(event) =>
                  patchConfig({ premiumRoleId: event.target.value || null })
                }
              >
                <option value="">No premium role</option>
                {initialData.roles
                  .filter((role) => role.assignable || role.id === state.config.premiumRoleId)
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}{role.assignable ? "" : " (unavailable)"}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["kofi", "patreon", "bmc"] as const).map((provider) => (
                <div key={provider}>
                  <Label htmlFor={`payment-${provider}`}>
                    {provider === "bmc" ? "Buy Me a Coffee" : provider[0].toUpperCase() + provider.slice(1)}
                  </Label>
                  <Input
                    id={`payment-${provider}`}
                    className="mt-1.5"
                    value={state.config.paymentLinks[provider] ?? ""}
                    onChange={(event) =>
                      patchConfig({
                        paymentLinks: {
                          ...state.config.paymentLinks,
                          [provider]: event.target.value || null,
                        },
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}
