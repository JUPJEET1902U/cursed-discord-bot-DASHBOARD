export interface PremiumPaymentLinks {
  kofi: string | null;
  patreon: string | null;
  bmc: string | null;
  checkout: string | null;
}

export interface PremiumPaymentSettings {
  enabled: boolean;
  currency: string;
  monthlyPrice: string;
  headline: string;
  instructions: string;
  links: PremiumPaymentLinks;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface PremiumAccount {
  userId: string;
  active: boolean;
  source: string;
  note: string;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  updatedAt: string | null;
}

export interface PremiumRoleOption {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface PremiumGuild {
  id: string;
  name: string;
  iconUrl: string | null;
  premiumRoleId: string | null;
  roles: PremiumRoleOption[];
}

export interface PremiumPlanLimits {
  name: string;
  aiReplyCooldownMs: number;
  memoryStoredMessages: number;
  memoryContextMessages: number;
  imageUserDaily: number;
  imageGuildDaily: number;
  imageCooldownMs: number;
  memeUserDaily: number;
  memeGuildDaily: number;
  memeCooldownMs: number;
  funUserDaily: number;
  funGuildDaily: number;
  ticketPanels: number;
  ticketCategoriesPerPanel: number;
  ticketQuestionsPerCategory: number;
  ticketHistoryDays: number;
  welcomeCard: boolean;
  analyticsHistoryDays: number;
}

export interface PremiumOwnerData {
  settings: PremiumPaymentSettings;
  accounts: PremiumAccount[];
  plans: {
    free: PremiumPlanLimits;
    premium: PremiumPlanLimits;
  };
  guilds: PremiumGuild[];
}

/**
 * Backward-compatible read-only server status used by the existing Settings
 * editor. The owner billing page uses PremiumOwnerData above.
 */
export interface PremiumStatus {
  active: boolean;
  plan: string | null;
  expiresAt: string | null;
}

export const DEFAULT_PREMIUM_STATUS: PremiumStatus = {
  active: false,
  plan: null,
  expiresAt: null,
};

export const PREMIUM_FEATURES_PREVIEW: string[] = [
  "Unlimited AI messages with no reply delay",
  "Larger AI memory and higher generation limits",
  "Premium welcome cards and customization",
  "More ticket dashboard panels and controls",
  "Advanced analytics and priority support",
];
