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

export async function botApiRequest<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit } = {}
): Promise<T> {
  const secret = requireServerEnv("DASHBOARD_API_SECRET");
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${secret}`);
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
