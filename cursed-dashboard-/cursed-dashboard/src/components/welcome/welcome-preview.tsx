"use client";

import { Bot } from "lucide-react";
import type { WelcomeConfig } from "@/types/welcome";
import { substituteWelcomeVariables } from "@/lib/welcome-variables";

interface WelcomePreviewProps {
  config: WelcomeConfig;
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
 */
export function WelcomePreview({ config, serverName }: WelcomePreviewProps) {
  const sample = SAMPLE(serverName);
  const sub = (t: string) => substituteWelcomeVariables(t, sample);

  const content = config.mentionUser
    ? sub(config.message).replace(sample.mention, "") // mention rendered separately as a pill below
    : sub(config.message);

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

          <div className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[#DBDEE1]">
            {config.mentionUser ? (
              <span className="mr-1 rounded bg-[#414675] px-1 py-0.5 text-[#C9CDFB]">
                {sample.mention}
              </span>
            ) : null}
            {content || (
              <span className="text-[#949BA4] italic">
                No message text — the embed below is all that will send.
              </span>
            )}
          </div>

          {config.embed.enabled ? (
            <div
              className="mt-2 flex max-w-md gap-3 rounded border-l-4 bg-[#2B2D31] p-3"
              style={{ borderColor: config.embed.color }}
            >
              <div className="min-w-0 flex-1">
                {config.embed.title ? (
                  <p className="text-sm font-semibold text-white">
                    {sub(config.embed.title)}
                  </p>
                ) : null}
                {config.embed.description ? (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#DBDEE1]">
                    {sub(config.embed.description)}
                  </p>
                ) : null}
                {config.embed.imageUrl ? (
                  <div className="mt-2 overflow-hidden rounded-md border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided remote URL, not a static asset */}
                    <img
                      src={config.embed.imageUrl}
                      alt=""
                      className="max-h-48 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
                {config.embed.footer ? (
                  <p className="mt-2 text-xs text-[#949BA4]">
                    {sub(config.embed.footer)}
                  </p>
                ) : null}
              </div>
              {config.embed.thumbnail ? (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-violet-dim to-crimson-dim">
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white/70">
                    icon
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
