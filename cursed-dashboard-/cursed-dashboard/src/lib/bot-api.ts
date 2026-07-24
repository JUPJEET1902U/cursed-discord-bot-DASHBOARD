import "server-only";
import { requireServerEnv } from "@/lib/env";

interface BotApiErrorPayload {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

export class BotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "BotApiError";
  }
}

function apiUrl(path: string): URL {
  const base = new URL(requireServerEnv("BOT_API_URL"));
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new Error("BOT_API_URL must use HTTPS in production.");
  }
  return new URL(`/api/dashboard/${path.replace(/^\/+/, "")}`, base);
}

function normalizeOrigin(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;

  try {
    const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

function dashboardOrigin(): string | null {
  // Vercel supplies a stable production alias without a protocol. Use it
  // instead of the deployment-specific VERCEL_URL so Railway's exact origin
  // allow-list continues to work after every redeployment.
  return (
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.DASHBOARD_URL)
  );
}

export async function botApiRequest<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit } = {}
): Promise<T> {
  const secret = requireServerEnv("DASHBOARD_API_SECRET");
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${secret}`);

  const origin = dashboardOrigin();
  if (origin && !headers.has("Origin")) headers.set("Origin", origin);

  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(10_000),
      headers,
    });
  } catch {
    throw new BotApiError(
      "The live bot API is unavailable. Try again shortly.",
      503,
      "BOT_API_UNAVAILABLE"
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | ({ data?: T } & BotApiErrorPayload)
    | null;
  if (!response.ok) {
    throw new BotApiError(
      payload?.error ?? "The live bot API rejected the request.",
      response.status,
      payload?.code ?? "BOT_API_ERROR",
      payload?.fieldErrors
    );
  }
  if (!payload || !("data" in payload)) {
    throw new BotApiError(
      "The live bot API returned an invalid response.",
      502,
      "INVALID_BOT_API_RESPONSE"
    );
  }
  return payload.data as T;
}

export async function getBotGuildPresence(
  guildIds: string[]
): Promise<Set<string>> {
  if (guildIds.length === 0) return new Set();
  const data = await botApiRequest<{ presentGuildIds: string[] }>(
    "guilds/presence",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildIds }),
    }
  );
  return new Set(data.presentGuildIds);
}
