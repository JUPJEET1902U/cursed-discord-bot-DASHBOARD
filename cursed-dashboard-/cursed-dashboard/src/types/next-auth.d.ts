import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Discord snowflake ID. */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    /**
     * Discord OAuth2 access token. Lives only in the encrypted JWE cookie —
     * never copied into the client-visible `Session` object (see the
     * `session` callback in `src/lib/auth/config.ts`). Read it server-side
     * with `getToken()` from `next-auth/jwt`.
     */
    accessToken?: string;
    accessTokenExpires?: number;
  }
}
