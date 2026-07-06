import "server-only";
import { headers } from "next/headers";

/**
 * Calls one of this app's own `/api/*` route handlers from a Server
 * Component or Server Action, forwarding the incoming request's cookies so
 * the session-protected route sees the same authenticated user.
 *
 * This keeps auth + Discord-fetching logic in exactly one place (the route
 * handler) instead of duplicating it wherever a page needs the same data.
 *
 * SECURITY: the base URL is taken from `NEXTAUTH_URL` (a trusted,
 * admin-set env var) — never from the incoming request's `Host` header.
 * Building it from `headers().get("host")` would let a request with a
 * forged Host header (e.g. behind a proxy that doesn't pin it) make this
 * server send the caller's session cookie to an attacker-controlled
 * origin. `NEXTAUTH_URL` is already a required env var for Auth.js itself,
 * so this doesn't add new configuration burden.
 */
export async function fetchInternal(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXTAUTH_URL is not set — required to safely resolve internal API calls."
    );
  }

  const hdrs = await headers();
  const cookie = hdrs.get("cookie") ?? "";

  return fetch(new URL(path, baseUrl), {
    ...init,
    headers: { ...(init?.headers ?? {}), cookie },
    cache: "no-store",
  });
}
