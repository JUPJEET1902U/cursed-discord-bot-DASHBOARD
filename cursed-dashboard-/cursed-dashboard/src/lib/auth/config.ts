import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Security notes:
 * - `DISCORD_CLIENT_SECRET` is read server-side only (via `process.env`) and is
 *   never referenced from a "use client" file, a `NEXT_PUBLIC_*` var, or an API
 *   response body. Auth.js uses it internally during the token exchange step
 *   of the OAuth2 code flow and it never leaves the server.
 * - We use the JWT session strategy (no database adapter yet — the spec for
 *   this step explicitly excludes DB writes). The session token is a signed +
 *   encrypted JWE, stored in an httpOnly, sameSite=lax, secure-in-production
 *   cookie. It can't be read or forged by client-side JS.
 * - The Discord OAuth `access_token` is intentionally kept out of the
 *   client-visible `session` object (see the `session` callback below). It's
 *   only readable server-side via `getToken()` from `next-auth/jwt`, which is
 *   what `src/lib/discord.ts` uses when it needs to call the Discord API on
 *   the user's behalf. Never spread `token.*` into `session` wholesale.
 */
export const authConfig = {
  // Explicit rather than relying on Auth.js's AUTH_SECRET auto-detection —
  // this repo's .env.example uses the NEXTAUTH_SECRET name, and
  // `getToken()` calls elsewhere (src/app/api/servers/route.ts) reference
  // that same env var, so this keeps both reading from one source of truth.
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      // `identify` → basic profile, `guilds` → GET /users/@me/guilds (needed
      // to build the server-selection list). We deliberately do NOT request
      // `guilds.join`, `bot`, or any write-capable scope here.
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only runs on initial sign-in, when `account`/`profile` are populated.
      if (account && profile) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        token.discordId = profile.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      // Whitelist only what the client actually needs to render UI.
      // token.accessToken is intentionally NOT copied here.
      if (session.user) {
        session.user.id = token.discordId as string;
      }
      return session;
    },
    // No `authorized` callback here on purpose: route protection is handled
    // explicitly in `src/middleware.ts`, which is the single source of
    // truth for "who can hit /dashboard/*". Keeping that logic in one place
    // (rather than split between this callback and the middleware) avoids
    // the two silently drifting out of sync.
  },
} satisfies NextAuthConfig;
