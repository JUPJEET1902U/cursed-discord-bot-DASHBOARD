export type WelcomeCardTheme = "classic" | "midnight" | "neon";

/**
 * Exact flat welcome fields read by the live Railway bot. The dashboard writes
 * these same top-level fields into the guild configuration used by CURSED.
 */
export interface WelcomeConfig {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeUseAI: boolean;
  welcomeColor: string | null;
  welcomeThumbnail: boolean;
  welcomeImageUrl: string | null;
  welcomeFooter: string | null;
  welcomeCardEnabled: boolean;
  welcomeCardTheme: WelcomeCardTheme;
  welcomeCardBackground: string | null;
  welcomeAccentColor: string | null;
  welcomeMediaUrl: string | null;
}

export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  welcomeEnabled: true,
  welcomeChannelId: null,
  welcomeMessage: null,
  welcomeUseAI: false,
  welcomeColor: null,
  welcomeThumbnail: true,
  welcomeImageUrl: null,
  welcomeFooter: null,
  welcomeCardEnabled: true,
  welcomeCardTheme: "classic",
  welcomeCardBackground: null,
  welcomeAccentColor: null,
  welcomeMediaUrl: null,
};

export const BOT_DEFAULT_WELCOME_MESSAGE =
  "**Welcome to {server}, {user}!** We're glad you're here.";
