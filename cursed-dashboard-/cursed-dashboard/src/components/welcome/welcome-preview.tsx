"use client";

import { Bot } from "lucide-react";
import { BOT_DEFAULT_WELCOME_MESSAGE, type WelcomeConfig } from "@/types/welcome";
import { substituteWelcomeVariables } from "@/lib/welcome-variables";

interface WelcomePreviewProps {
  config: WelcomeConfig;
  enabled?: boolean;
  serverName: string;
}

const SAMPLE = (serverName: string) => ({
  user: "NewMember",
  username: "NewMember",
  mention: "@NewMember",
  server: serverName,
  membercount: "1,284",
});

const themeBackground: Record<WelcomeConfig["welcomeCardTheme"], string> = {
  classic: "linear-gradient(135deg, #111827, #1f2937)",
  midnight: "linear-gradient(135deg, #020617, #172554)",
  neon: "linear-gradient(135deg, #12001F, #111827)",
};

export function WelcomePreview({ config, enabled, serverName }: WelcomePreviewProps) {
  const active = enabled ?? config.welcomeEnabled;
  const sample = SAMPLE(serverName);
  const sub = (text: string) => substituteWelcomeVariables(text, sample);
  const content = sub(config.welcomeMessage || BOT_DEFAULT_WELCOME_MESSAGE);
  const embedColor = config.welcomeColor ?? "#5865F2";
  const accent = config.welcomeAccentColor ?? embedColor;
  const cardBackground = config.welcomeCardBackground || config.welcomeMediaUrl;

  return (
    <div className="rounded-xl bg-[#313338] p-4 font-body">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-crimson">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">CURSED</span>
            <span className="rounded bg-violet px-1 py-[1px] text-[10px] font-medium text-white">BOT</span>
            <span className="text-xs text-[#949BA4]">Today at 12:00 PM</span>
          </div>

          {!active ? (
            <div className="mt-0.5 text-sm italic text-[#949BA4]">
              Welcome messages are disabled — nothing will be posted when someone joins.
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
                  <p className="mb-2 text-sm font-semibold text-white">👋 Welcome to {serverName}!</p>
                  {config.welcomeCardEnabled ? (
                    <div
                      className="relative mb-2 overflow-hidden rounded-lg border border-white/10 p-4"
                      style={{
                        backgroundImage: cardBackground
                          ? `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${cardBackground})`
                          : themeBackground[config.welcomeCardTheme],
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: accent }} />
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 bg-black/30 text-xs font-semibold text-white"
                          style={{ borderColor: accent }}
                        >
                          avatar
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold tracking-[0.18em]" style={{ color: accent }}>WELCOME</p>
                          <p className="truncate text-xl font-extrabold text-white">NewMember</p>
                          <p className="truncate text-xs text-white/75">to {serverName}</p>
                          <p className="mt-2 text-[10px] text-white/70">Member #1,284</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {config.welcomeImageUrl ? (
                    <div className="overflow-hidden rounded-md border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user URL */}
                      <img
                        src={config.welcomeImageUrl}
                        alt=""
                        className="max-h-48 w-full object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                  {config.welcomeFooter ? (
                    <p className="mt-2 text-xs text-[#949BA4]">{sub(config.welcomeFooter)}</p>
                  ) : (
                    <p className="mt-2 text-xs text-[#949BA4]">Member #1,284</p>
                  )}
                </div>
                {config.welcomeThumbnail ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-violet-dim to-crimson-dim">
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white/70">avatar</div>
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
