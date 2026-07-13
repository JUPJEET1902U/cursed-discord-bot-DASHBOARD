"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import { ZodError } from "zod";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ServerErrorBanner, UnsavedChangesBanner } from "@/components/dashboard/editor-chrome";
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
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/welcome/color-picker";
import { WelcomePreview } from "@/components/welcome/welcome-preview";
import { useToast } from "@/hooks/use-toast";
import { WELCOME_VARIABLES } from "@/lib/welcome-variables";
import { welcomeConfigSchema } from "@/lib/validation/welcome";
import { cn } from "@/lib/utils";
import { DEFAULT_WELCOME_CONFIG, type WelcomeConfig } from "@/types/welcome";
import type { DiscordChannel } from "@/types/discord";

interface WelcomeEditorProps {
  guildId: string;
  guildName: string;
  initialConfig: WelcomeConfig;
  initialChannels: DiscordChannel[] | null;
}

type FieldErrors = Partial<Record<keyof WelcomeConfig | "enabled", string>>;

function disabledConfig(config: WelcomeConfig): WelcomeConfig {
  return {
    ...config,
    welcomeChannelId: null,
    welcomeMessage: null,
    welcomeUseAI: false,
    welcomeColor: null,
    welcomeThumbnail: true,
    welcomeImageUrl: null,
    welcomeFooter: null,
  };
}

function normalizeConfig(config: WelcomeConfig): WelcomeConfig {
  return {
    welcomeChannelId: config.welcomeChannelId || null,
    welcomeMessage: config.welcomeMessage || null,
    welcomeUseAI: config.welcomeUseAI,
    welcomeColor: config.welcomeColor || null,
    welcomeThumbnail: config.welcomeThumbnail !== false,
    welcomeImageUrl: config.welcomeImageUrl || null,
    welcomeFooter: config.welcomeFooter || null,
  };
}

function validate(enabled: boolean, config: WelcomeConfig): FieldErrors {
  const errors: FieldErrors = {};
  if (enabled && !config.welcomeChannelId) {
    errors.welcomeChannelId =
      "Choose a welcome channel before enabling welcome messages.";
  }

  try {
    welcomeConfigSchema.parse(enabled ? normalizeConfig(config) : disabledConfig(config));
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.flatten().fieldErrors;
      for (const [key, value] of Object.entries(fields)) {
        const first = value?.[0];
        if (first) errors[key as keyof WelcomeConfig] = first;
      }
    }
  }

  return errors;
}

function VariableChips({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {WELCOME_VARIABLES.map((v) => (
        <button
          key={v.token}
          type="button"
          onClick={() => onInsert(v.token)}
          title={v.label}
          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-ash transition-colors hover:border-violet/50 hover:text-fog"
        >
          {v.token}
        </button>
      ))}
    </div>
  );
}

export function WelcomeEditor({
  guildId,
  guildName,
  initialConfig,
  initialChannels,
}: WelcomeEditorProps) {
  const { toast } = useToast();
  const [channels] = useState<DiscordChannel[] | null>(initialChannels);
  const [savedConfig, setSavedConfig] = useState(() =>
    normalizeConfig(initialConfig)
  );
  const [config, setConfig] = useState(() => normalizeConfig(initialConfig));
  const [savedEnabled, setSavedEnabled] = useState(
    Boolean(initialConfig.welcomeChannelId)
  );
  const [enabled, setEnabled] = useState(Boolean(initialConfig.welcomeChannelId));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty =
    enabled !== savedEnabled ||
    JSON.stringify(normalizeConfig(config)) !== JSON.stringify(savedConfig);
  const errors = useMemo(() => validate(enabled, config), [enabled, config]);
  const hasErrors = Object.values(errors).some(Boolean);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patch = useCallback((next: Partial<WelcomeConfig>) => {
    setConfig((prev) => normalizeConfig({ ...prev, ...next }));
    setSuccess(null);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(savedConfig);
    setEnabled(savedEnabled);
    setServerError(null);
    setSuccess(null);
  }, [savedConfig, savedEnabled]);

  const handleSave = useCallback(async () => {
    if (hasErrors) {
      toast({
        title: "Fix the highlighted fields",
        description: "Some welcome settings are not valid yet.",
        variant: "error",
      });
      return;
    }

    const payload = enabled ? normalizeConfig(config) : disabledConfig(config);
    setSaving(true);
    setServerError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/guilds/${guildId}/welcome`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? "Couldn't save welcome settings.";
        setServerError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }

      const nextConfig = normalizeConfig(data.config ?? DEFAULT_WELCOME_CONFIG);
      setConfig(nextConfig);
      setSavedConfig(nextConfig);
      setEnabled(Boolean(nextConfig.welcomeChannelId));
      setSavedEnabled(Boolean(nextConfig.welcomeChannelId));
      setSuccess("Welcome settings saved. The live bot will pick it up after its next config refresh.");
      toast({
        title: "Welcome settings saved",
        description: "Saved to the same MongoDB config read by the bot.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the server.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [config, enabled, guildId, hasErrors, toast]);

  const messageLength = config.welcomeMessage?.length ?? 0;

  return (
    <div>
      <UnsavedChangesBanner
        dirty={dirty}
        saving={saving}
        hasErrors={hasErrors}
        onSave={handleSave}
        onReset={handleReset}
      />

      <ServerErrorBanner message={serverError} />

      {success ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <DashboardCard
            title="Welcome"
            description="Controls the bot fields stored as welcomeChannelId, welcomeMessage, welcomeUseAI, welcomeColor, welcomeThumbnail, welcomeImageUrl, and welcomeFooter."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="welcome-enabled">Enable welcome messages</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    The live bot treats this as enabled when `welcomeChannelId`
                    has a value.
                  </p>
                </div>
                <Switch
                  id="welcome-enabled"
                  checked={enabled}
                  onCheckedChange={(checked) => {
                    setEnabled(checked);
                    setSuccess(null);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="welcome-channel">Text channel</Label>
                <div className="mt-1.5">
                  {channels ? (
                    <Select
                      value={config.welcomeChannelId ?? undefined}
                      onValueChange={(value) => patch({ welcomeChannelId: value })}
                    >
                      <SelectTrigger id="welcome-channel">
                        <SelectValue placeholder="Select a channel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-ash">
                            No text channels found.
                          </div>
                        ) : (
                          channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              #{channel.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Input
                        id="welcome-channel"
                        value={config.welcomeChannelId ?? ""}
                        onChange={(e) =>
                          patch({ welcomeChannelId: e.target.value || null })
                        }
                        placeholder="Channel ID, e.g. 123456789012345678"
                      />
                      <p className="mt-1.5 text-xs text-ash">
                        Channel list unavailable. Enter a channel ID directly;
                        the API still validates access and snowflake format.
                      </p>
                    </>
                  )}
                </div>
                {errors.welcomeChannelId ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.welcomeChannelId}
                  </p>
                ) : null}
              </div>

              {!enabled ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ash">
                  Empty state: saving while disabled clears the bot&apos;s welcome
                  fields and leaves `welcomeChannelId` as null.
                </div>
              ) : null}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Message"
            description="Stored as welcomeMessage. Leave blank to use the bot's built-in default message."
          >
            <Textarea
              value={config.welcomeMessage ?? ""}
              onChange={(e) => patch({ welcomeMessage: e.target.value || null })}
              placeholder="Welcome {mention} to {server}!"
              rows={4}
              maxLength={2000}
            />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <VariableChips
                onInsert={(token) =>
                  patch({ welcomeMessage: `${config.welcomeMessage ?? ""}${token}` })
                }
              />
              <span
                className={cn(
                  "shrink-0 pt-2 text-xs text-ash",
                  messageLength > 2000 && "text-crimson-bright"
                )}
              >
                {messageLength}/2000
              </span>
            </div>
            {errors.welcomeMessage ? (
              <p className="mt-1.5 text-xs text-crimson-bright">
                {errors.welcomeMessage}
              </p>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="Bot embed options"
            description="These are the options passed to the live bot's rich embed builder."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="welcome-ai">Use AI welcome text</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    Stored as welcomeUseAI. The bot falls back to the custom or
                    default message if AI fails.
                  </p>
                </div>
                <Switch
                  id="welcome-ai"
                  checked={config.welcomeUseAI}
                  onCheckedChange={(checked) => patch({ welcomeUseAI: checked })}
                />
              </div>

              <div>
                <Label htmlFor="welcome-color">Embed color</Label>
                <div className="mt-1.5">
                  <ColorPicker
                    value={config.welcomeColor ?? "#5865F2"}
                    onChange={(color) => patch({ welcomeColor: color })}
                  />
                </div>
                {errors.welcomeColor ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.welcomeColor}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="welcome-thumbnail">Show member avatar</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    Stored as welcomeThumbnail.
                  </p>
                </div>
                <Switch
                  id="welcome-thumbnail"
                  checked={config.welcomeThumbnail}
                  onCheckedChange={(checked) =>
                    patch({ welcomeThumbnail: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="welcome-image">Banner image URL</Label>
                <Input
                  id="welcome-image"
                  className="mt-1.5"
                  value={config.welcomeImageUrl ?? ""}
                  onChange={(e) =>
                    patch({ welcomeImageUrl: e.target.value || null })
                  }
                  placeholder="https://example.com/banner.png"
                />
                {errors.welcomeImageUrl ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.welcomeImageUrl}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="welcome-footer">Footer text</Label>
                <Input
                  id="welcome-footer"
                  className="mt-1.5"
                  value={config.welcomeFooter ?? ""}
                  onChange={(e) =>
                    patch({ welcomeFooter: e.target.value || null })
                  }
                  placeholder="Member #{membercount}"
                  maxLength={2048}
                />
                <VariableChips
                  onInsert={(token) =>
                    patch({ welcomeFooter: `${config.welcomeFooter ?? ""}${token}` })
                  }
                />
                {errors.welcomeFooter ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.welcomeFooter}
                  </p>
                ) : null}
              </div>
            </div>
          </DashboardCard>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={!dirty || saving}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving || hasErrors}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <DashboardCard
              title="Preview"
              description="Approximate render of the embed the live bot builds."
            >
              <WelcomePreview
                config={config}
                enabled={enabled}
                serverName={guildName}
              />
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
