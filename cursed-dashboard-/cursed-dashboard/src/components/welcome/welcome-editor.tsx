"use client";

import { useCallback, useState } from "react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  EditorActions,
  ServerErrorBanner,
  UnsavedChangesBanner,
} from "@/components/dashboard/editor-chrome";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/welcome/color-picker";
import { WelcomePreview } from "@/components/welcome/welcome-preview";
import { WELCOME_VARIABLES } from "@/lib/welcome-variables";
import { useSettingsEditor } from "@/hooks/use-settings-editor";
import { cn } from "@/lib/utils";
import type { WelcomeConfig } from "@/types/welcome";
import type { DiscordChannel } from "@/types/discord";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

interface WelcomeEditorProps {
  guildId: string;
  guildName: string;
  initialConfig: WelcomeConfig;
  initialChannels: DiscordChannel[] | null;
}

type FieldErrors = Partial<{
  channelId: string;
  message: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  embedFooter: string;
  embedImageUrl: string;
}>;

function validate(config: WelcomeConfig): FieldErrors {
  const errors: FieldErrors = {};

  if (config.enabled && !config.channelId) {
    errors.channelId = "Choose a welcome channel before enabling welcome messages.";
  }
  if (config.message.length > 2000) {
    errors.message = "Message must be 2000 characters or fewer.";
  }
  if (config.embed.enabled) {
    if (config.embed.title.length > 256) {
      errors.embedTitle = "Embed title must be 256 characters or fewer.";
    }
    if (config.embed.description.length > 4096) {
      errors.embedDescription = "Embed description must be 4096 characters or fewer.";
    }
    if (!HEX_COLOR.test(config.embed.color)) {
      errors.embedColor = "Color must be a hex value, e.g. #7C3AED.";
    }
    if (config.embed.footer.length > 2048) {
      errors.embedFooter = "Footer must be 2048 characters or fewer.";
    }
    if (
      config.embed.imageUrl !== "" &&
      !/^https?:\/\/\S+$/i.test(config.embed.imageUrl)
    ) {
      errors.embedImageUrl = "Must be empty or a valid http(s) URL.";
    }
  }

  return errors;
}

/** Small pill buttons that insert a template variable at cursor-less "append" position. */
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
  const [channels] = useState<DiscordChannel[] | null>(initialChannels);

  const {
    config,
    setConfig,
    patch,
    dirty,
    errors,
    hasErrors,
    saving,
    serverError,
    handleSave,
    handleReset,
  } = useSettingsEditor({
    endpoint: `/api/guilds/${guildId}/welcome`,
    initialConfig,
    validate,
    successTitle: "Welcome settings saved",
    genericErrorMessage: "Couldn't save welcome settings.",
  });

  const patchEmbed = useCallback(
    (next: Partial<WelcomeConfig["embed"]>) => {
      setConfig((prev) => ({ ...prev, embed: { ...prev.embed, ...next } }));
    },
    [setConfig]
  );

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Editor column */}
        <div className="space-y-6 lg:col-span-3">
          <DashboardCard
            title="General"
            description="Turn welcome messages on and choose where they post."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="welcome-enabled">Enable welcome messages</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    When off, nothing is posted when someone joins.
                  </p>
                </div>
                <Switch
                  id="welcome-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => patch({ enabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="welcome-channel">Welcome channel</Label>
                <div className="mt-1.5">
                  {channels ? (
                    <Select
                      value={config.channelId ?? undefined}
                      onValueChange={(value) => patch({ channelId: value })}
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
                          channels.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              #{c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Input
                        id="welcome-channel"
                        value={config.channelId ?? ""}
                        onChange={(e) =>
                          patch({ channelId: e.target.value || null })
                        }
                        placeholder="Channel ID (e.g. 123456789012345678)"
                      />
                      <p className="mt-1.5 text-xs text-ash">
                        Couldn&apos;t load this server&apos;s channel list — enter
                        the channel ID directly. (Enable Developer Mode in
                        Discord, then right-click a channel → Copy Channel ID.)
                      </p>
                    </>
                  )}
                </div>
                {errors.channelId ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.channelId}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="welcome-mention">Mention new member</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    Pings the member alongside the message.
                  </p>
                </div>
                <Switch
                  id="welcome-mention"
                  checked={config.mentionUser}
                  onCheckedChange={(checked) => patch({ mentionUser: checked })}
                />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Message"
            description="Plain text sent alongside (or instead of) the embed."
          >
            <Textarea
              value={config.message}
              onChange={(e) => patch({ message: e.target.value })}
              placeholder="Welcome {mention} to {server}!"
              rows={3}
              maxLength={2000}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <VariableChips
                onInsert={(token) =>
                  patch({ message: `${config.message}${token}` })
                }
              />
              <span
                className={cn(
                  "shrink-0 pl-3 text-xs text-ash",
                  config.message.length > 2000 && "text-crimson-bright"
                )}
              >
                {config.message.length}/2000
              </span>
            </div>
            {errors.message ? (
              <p className="mt-1.5 text-xs text-crimson-bright">
                {errors.message}
              </p>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="Embed"
            description="A richer, colored card shown below the message."
            action={
              <Switch
                checked={config.embed.enabled}
                onCheckedChange={(checked) => patchEmbed({ enabled: checked })}
                aria-label="Enable embed"
              />
            }
          >
            <fieldset
              disabled={!config.embed.enabled}
              className={cn(
                "space-y-5 transition-opacity",
                !config.embed.enabled && "pointer-events-none opacity-40"
              )}
            >
              <div>
                <Label htmlFor="embed-title">Title</Label>
                <Input
                  id="embed-title"
                  className="mt-1.5"
                  value={config.embed.title}
                  onChange={(e) => patchEmbed({ title: e.target.value })}
                  placeholder="Welcome to {server}!"
                  maxLength={256}
                />
                {errors.embedTitle ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.embedTitle}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="embed-description">Description</Label>
                <Textarea
                  id="embed-description"
                  className="mt-1.5"
                  value={config.embed.description}
                  onChange={(e) => patchEmbed({ description: e.target.value })}
                  placeholder="Hey {user}, glad you're here!"
                  rows={3}
                  maxLength={4096}
                />
                <VariableChips
                  onInsert={(token) =>
                    patchEmbed({ description: `${config.embed.description}${token}` })
                  }
                />
                {errors.embedDescription ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.embedDescription}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="embed-color">Color</Label>
                <div className="mt-1.5">
                  <ColorPicker
                    value={config.embed.color}
                    onChange={(color) => patchEmbed({ color })}
                    disabled={!config.embed.enabled}
                  />
                </div>
                {errors.embedColor ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.embedColor}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="embed-thumbnail">Show thumbnail</Label>
                  <p className="mt-0.5 text-xs text-ash">
                    Displays the server icon in the corner of the embed.
                  </p>
                </div>
                <Switch
                  id="embed-thumbnail"
                  checked={config.embed.thumbnail}
                  onCheckedChange={(checked) => patchEmbed({ thumbnail: checked })}
                />
              </div>

              <div>
                <Label htmlFor="embed-footer">Footer text</Label>
                <Input
                  id="embed-footer"
                  className="mt-1.5"
                  value={config.embed.footer}
                  onChange={(e) => patchEmbed({ footer: e.target.value })}
                  placeholder="Member #{membercount}"
                  maxLength={2048}
                />
                {errors.embedFooter ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.embedFooter}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="embed-image">Image URL (optional)</Label>
                <Input
                  id="embed-image"
                  className="mt-1.5"
                  value={config.embed.imageUrl}
                  onChange={(e) => patchEmbed({ imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.png"
                />
                {errors.embedImageUrl ? (
                  <p className="mt-1.5 text-xs text-crimson-bright">
                    {errors.embedImageUrl}
                  </p>
                ) : null}
              </div>
            </fieldset>
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

        {/* Live preview column */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <DashboardCard
              title="Live preview"
              description="Approximate — the bot renders the real message."
            >
              <WelcomePreview config={config} serverName={guildName} />
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
