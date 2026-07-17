"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Sparkles } from "lucide-react";
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
import { ColorPicker } from "@/components/welcome/color-picker";
import { WelcomePreview } from "@/components/welcome/welcome-preview";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { welcomeConfigSchema } from "@/lib/validation/welcome";
import { WELCOME_VARIABLES } from "@/lib/welcome-variables";
import type { DiscordChannel } from "@/types/discord";
import {
  DEFAULT_WELCOME_CONFIG,
  type WelcomeCardTheme,
  type WelcomeConfig,
} from "@/types/welcome";

interface WelcomeEditorProps {
  guildId: string;
  guildName: string;
  initialConfig: WelcomeConfig;
  initialChannels: DiscordChannel[];
}

type FieldErrors = Partial<Record<keyof WelcomeConfig, string>>;

const selectClass =
  "h-10 w-full rounded-lg border border-white/10 bg-steel/60 px-3.5 text-sm text-fog outline-none transition-colors focus:border-violet/60 focus:ring-1 focus:ring-violet/60";

function normalizeConfig(config: Partial<WelcomeConfig>): WelcomeConfig {
  return {
    ...DEFAULT_WELCOME_CONFIG,
    ...config,
    welcomeEnabled: config.welcomeEnabled !== false,
    welcomeChannelId: config.welcomeChannelId || null,
    welcomeMessage: config.welcomeMessage || null,
    welcomeUseAI: config.welcomeUseAI === true,
    welcomeColor: config.welcomeColor || null,
    welcomeThumbnail: config.welcomeThumbnail !== false,
    welcomeImageUrl: config.welcomeImageUrl || null,
    welcomeFooter: config.welcomeFooter || null,
    welcomeCardEnabled: config.welcomeCardEnabled !== false,
    welcomeCardTheme: config.welcomeCardTheme || "classic",
    welcomeCardBackground: config.welcomeCardBackground || null,
    welcomeAccentColor: config.welcomeAccentColor || null,
    welcomeMediaUrl: config.welcomeMediaUrl || null,
  };
}

function VariableChips({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {WELCOME_VARIABLES.map((variable) => (
        <button
          key={variable.token}
          type="button"
          onClick={() => onInsert(variable.token)}
          title={variable.label}
          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-ash transition-colors hover:border-violet/50 hover:text-fog"
        >
          {variable.token}
        </button>
      ))}
    </div>
  );
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
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-ash">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
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
  const [savedConfig, setSavedConfig] = useState(() => normalizeConfig(initialConfig));
  const [config, setConfig] = useState(() => normalizeConfig(initialConfig));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const validation = useMemo(() => welcomeConfigSchema.safeParse(config), [config]);
  const clientFieldErrors = useMemo<FieldErrors>(() => {
    if (validation.success) return {};
    const errors: FieldErrors = {};
    for (const issue of validation.error.issues) {
      const key = issue.path[0] as keyof WelcomeConfig | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return errors;
  }, [validation]);
  const errors = { ...serverFieldErrors, ...clientFieldErrors };
  const hasErrors = Object.values(errors).some(Boolean);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patch = useCallback((next: Partial<WelcomeConfig>) => {
    setConfig((previous) => normalizeConfig({ ...previous, ...next }));
    setServerError(null);
    setServerFieldErrors({});
    setSuccess(null);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(savedConfig);
    setServerError(null);
    setServerFieldErrors({});
    setSuccess(null);
  }, [savedConfig]);

  const handleSave = useCallback(async () => {
    const parsed = welcomeConfigSchema.safeParse(config);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Some welcome settings are invalid.";
      setServerError(message);
      toast({ title: "Fix the welcome settings", description: message, variant: "error" });
      return;
    }

    setSaving(true);
    setServerError(null);
    setServerFieldErrors({});
    setSuccess(null);
    try {
      const response = await fetch(`/api/guilds/${guildId}/welcome`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error ?? "Couldn't save welcome settings.";
        const nextErrors: FieldErrors = {};
        for (const [key, messages] of Object.entries(data?.fieldErrors ?? {})) {
          if (Array.isArray(messages) && typeof messages[0] === "string") {
            nextErrors[key as keyof WelcomeConfig] = messages[0];
          }
        }
        setServerFieldErrors(nextErrors);
        setServerError(message);
        toast({ title: "Save failed", description: message, variant: "error" });
        return;
      }

      const next = normalizeConfig(data.config);
      setConfig(next);
      setSavedConfig(next);
      setSuccess("The live bot is now using this welcome configuration.");
      toast({
        title: "Welcome settings saved",
        description: "Message, embed, and card changes are active in CURSED.",
        variant: "success",
      });
    } catch {
      const message = "Network error - couldn't reach the dashboard API.";
      setServerError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [config, guildId, toast]);

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
          <DashboardCard title="Welcome delivery" description="Choose where and whether CURSED greets new members.">
            <ToggleRow
              id="welcome-enabled"
              label="Enable welcome messages"
              description="Turning this off preserves every design setting but sends nothing."
              checked={config.welcomeEnabled}
              onChange={(checked) => patch({ welcomeEnabled: checked })}
            />
            <div className="mt-4">
              <Label htmlFor="welcome-channel">Welcome channel</Label>
              <select
                id="welcome-channel"
                className={`${selectClass} mt-1.5`}
                value={config.welcomeChannelId ?? ""}
                onChange={(event) => patch({ welcomeChannelId: event.target.value || null })}
              >
                <option value="">Select a channel</option>
                {initialChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>#{channel.name}</option>
                ))}
              </select>
              {errors.welcomeChannelId ? (
                <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeChannelId}</p>
              ) : null}
            </div>
          </DashboardCard>

          <DashboardCard title="Welcome message" description="Use the same placeholders supported by the live bot.">
            <Textarea
              value={config.welcomeMessage ?? ""}
              onChange={(event) => patch({ welcomeMessage: event.target.value || null })}
              placeholder="Welcome {mention} to {server}! You are member #{membercount}."
              rows={5}
              maxLength={2000}
            />
            <div className="flex items-start justify-between gap-3">
              <VariableChips
                onInsert={(token) => patch({ welcomeMessage: `${config.welcomeMessage ?? ""}${token}` })}
              />
              <span className={cn("shrink-0 pt-2 text-xs text-ash", (config.welcomeMessage?.length ?? 0) >= 1900 && "text-amber-300")}>
                {config.welcomeMessage?.length ?? 0}/2000
              </span>
            </div>
            {errors.welcomeMessage ? (
              <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeMessage}</p>
            ) : null}
            <ToggleRow
              id="welcome-ai"
              label="Generate welcome text with AI"
              description="Falls back to your custom or built-in message if providers fail."
              checked={config.welcomeUseAI}
              onChange={(checked) => patch({ welcomeUseAI: checked })}
            />
          </DashboardCard>

          <DashboardCard
            title="Premium welcome card"
            description="Controls the PNG card generated by @napi-rs/canvas in Railway."
            action={<Sparkles className="h-5 w-5 text-violet-bright" />}
          >
            <ToggleRow
              id="welcome-card"
              label="Generate a welcome card"
              description="If Attach Files is unavailable, CURSED automatically sends the embed only."
              checked={config.welcomeCardEnabled}
              onChange={(checked) => patch({ welcomeCardEnabled: checked })}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="welcome-theme">Card theme</Label>
                <select
                  id="welcome-theme"
                  className={`${selectClass} mt-1.5`}
                  value={config.welcomeCardTheme}
                  onChange={(event) => patch({ welcomeCardTheme: event.target.value as WelcomeCardTheme })}
                >
                  <option value="classic">Classic</option>
                  <option value="midnight">Midnight</option>
                  <option value="neon">Neon</option>
                </select>
              </div>
              <div>
                <Label>Card accent color</Label>
                <div className="mt-1.5">
                  <ColorPicker
                    value={config.welcomeAccentColor ?? config.welcomeColor ?? "#5865F2"}
                    onChange={(color) => patch({ welcomeAccentColor: color })}
                  />
                </div>
                {errors.welcomeAccentColor ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeAccentColor}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="welcome-card-background">Custom card background URL</Label>
              <Input
                id="welcome-card-background"
                className="mt-1.5"
                value={config.welcomeCardBackground ?? ""}
                onChange={(event) => patch({ welcomeCardBackground: event.target.value || null })}
                placeholder="https://example.com/welcome-background.webp"
              />
              {errors.welcomeCardBackground ? (
                <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeCardBackground}</p>
              ) : null}
            </div>
            <div className="mt-4">
              <Label htmlFor="welcome-media">Fallback media URL</Label>
              <Input
                id="welcome-media"
                className="mt-1.5"
                value={config.welcomeMediaUrl ?? ""}
                onChange={(event) => patch({ welcomeMediaUrl: event.target.value || null })}
                placeholder="Optional fallback background or media URL"
              />
              {errors.welcomeMediaUrl ? (
                <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeMediaUrl}</p>
              ) : null}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Discord embed"
            description="Controls the embed wrapped around the message and optional PNG card."
            action={<ImageIcon className="h-5 w-5 text-violet-bright" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Embed color</Label>
                <div className="mt-1.5">
                  <ColorPicker
                    value={config.welcomeColor ?? "#5865F2"}
                    onChange={(color) => patch({ welcomeColor: color })}
                  />
                </div>
              </div>
              <div className="pt-1">
                <ToggleRow
                  id="welcome-thumbnail"
                  label="Show member avatar"
                  description="Adds the joining member's avatar as the embed thumbnail."
                  checked={config.welcomeThumbnail}
                  onChange={(checked) => patch({ welcomeThumbnail: checked })}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="welcome-image">Embed banner URL</Label>
              <Input
                id="welcome-image"
                className="mt-1.5"
                value={config.welcomeImageUrl ?? ""}
                onChange={(event) => patch({ welcomeImageUrl: event.target.value || null })}
                placeholder="https://example.com/banner.png"
              />
              {errors.welcomeImageUrl ? (
                <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeImageUrl}</p>
              ) : null}
            </div>
            <div className="mt-4">
              <Label htmlFor="welcome-footer">Footer text</Label>
              <Input
                id="welcome-footer"
                className="mt-1.5"
                value={config.welcomeFooter ?? ""}
                onChange={(event) => patch({ welcomeFooter: event.target.value || null })}
                placeholder="Member #{membercount}"
                maxLength={2048}
              />
              <VariableChips
                onInsert={(token) => patch({ welcomeFooter: `${config.welcomeFooter ?? ""}${token}` })}
              />
              {errors.welcomeFooter ? (
                <p className="mt-1.5 text-xs text-crimson-bright">{errors.welcomeFooter}</p>
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
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <DashboardCard
              title="Live-style preview"
              description="Approximates the embed and card rendered by the Railway bot."
            >
              <WelcomePreview config={config} serverName={guildName} />
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
