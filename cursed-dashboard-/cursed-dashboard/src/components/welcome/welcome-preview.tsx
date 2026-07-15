"use client";

import { Bot } from "lucide-react";
import { BOT_DEFAULT_WELCOME_MESSAGE, type WelcomeConfig } from "@/types/welcome";
import { substituteWelcomeVariables } from "@/lib/welcome-variables";

interface WelcomePreviewProps {
  config: WelcomeConfig;
  enabled: boolean;
  serverName: string;
}

const SAMPLE = (serverName: string) => ({
  user: "NewMember",
  mention: "@NewMember",
  server: serverName,
  membercount: "1,284",
});

/**
 * Renders a Discord-message-shaped mock — never an actual send, just a
 * visual approximation so people can see what their config will look like
 * before saving. Purely presentational; no network calls.
 *
 * Built from the same flat `WelcomeConfig` fields the live bot reads: there
 * is no separate "embed enabled" flag or "mention user" toggle in that
 * shape, so the embed box is always shown (built from welcomeColor /
 * welcomeThumbnail / welcomeImageUrl / welcomeFooter) and mentions are
 * whatever the message text itself includes via the {mention} variable.
 */
export function WelcomePreview({ config, enabled, serverName }: WelcomePreviewProps) {
  const sample = SAMPLE(serverName);
  const sub = (t: string) => substituteWelcomeVariables(t, sample);
  const content = sub(config.welcomeMessage || BOT_DEFAULT_WELCOME_MESSAGE);
  const embedColor = config.welcomeColor ?? "#5865F2";

  return (
    <div className="rounded-xl bg-[#313338] p-4 font-body">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-crimson">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">CURSED</span>
            <span className="rounded bg-violet px-1 py-[1px] text-[10px] font-medium text-white">
              BOT
            </span>
            <span className="text-xs text-[#949BA4]">Today at 12:00 PM</span>
          </div>

          {!enabled ? (
            <div className="mt-0.5 text-sm italic text-[#949BA4]">
              Welcome messages are disabled — nothing will be posted when
              someone joins.
            </div>
          ) : (
            <>
              <div className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[#DBDEE1]">
                {content}
              </div>

              <div
                className="mt-2 flex max-w-md gap-3 rounded border-l-4 bg-[#2B2D31] p-3"
                style={{ borderColor: embedColor }}
              >
                <div className="min-w-0 flex-1">
                  {config.welcomeImageUrl ? (
                    <div className="overflow-hidden rounded-md border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided remote URL, not a static asset */}
                      <img
                        src={config.welcomeImageUrl}
                        alt=""
                        className="max-h-48 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                  {config.welcomeFooter ? (
                    <p className="mt-2 text-xs text-[#949BA4]">
                      {sub(config.welcomeFooter)}
                    </p>
                  ) : null}
                </div>
                {config.welcomeThumbnail ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-violet-dim to-crimson-dim">
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white/70">
                      icon
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
