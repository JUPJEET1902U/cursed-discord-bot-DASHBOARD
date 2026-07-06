import NextAuth from "next-auth";
import { authConfig } from "./config";

/**
 * Central Auth.js instance.
 *
 * `auth()` — call from Server Components, Route Handlers, and Server
 * Actions to read the current session. It's an async function, not a hook.
 *
 * `handlers` — the GET/POST route handlers, re-exported from
 * `src/app/api/auth/[...nextauth]/route.ts`.
 *
 * `signIn` / `signOut` — server-side helpers (e.g. for Server Actions).
 * Client Components should import `signIn`/`signOut` from `next-auth/react`
 * instead (see `src/components/shared/discord-sign-in-button.tsx`).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
