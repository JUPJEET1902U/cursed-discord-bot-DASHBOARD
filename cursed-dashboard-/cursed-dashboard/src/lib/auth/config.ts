import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";

function isBotOwnerId(userId: unknown): boolean {
  const id = String(userId ?? "");
  return (process.env.BOT_OWNER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(id);
}

/**
 * Auth.js (NextAuth v5) configuration.
 * Discord tokens remain server-side; the client session only receives the
 * user's Discord ID and an owner boolean derived from BOT_OWNER_IDS.
 */
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        token.discordId = profile.id as string;
      }
      token.isOwner = isBotOwnerId(token.discordId);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.discordId as string;
        session.user.isOwner = token.isOwner === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
