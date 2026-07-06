"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Wraps the app with Auth.js's client-side SessionProvider so
 * `useSession()` works in Client Components (e.g. the sidebar's user menu
 * in a later step). Session data is fetched from `/api/auth/session` on
 * mount — only the whitelisted fields from the `session` callback in
 * `src/lib/auth/config.ts`, never the Discord access token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
