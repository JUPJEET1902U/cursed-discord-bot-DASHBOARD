import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Discord snowflake ID. */
      id: string;
      /** True only when the ID is listed in server-side BOT_OWNER_IDS. */
      isOwner: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    isOwner?: boolean;
    /** Server-only Discord OAuth token. Never copied to Session. */
    accessToken?: string;
    accessTokenExpires?: number;
  }
}
