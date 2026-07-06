/**
 * Placeholder types for the future Premium tier (see `docs/ARCHITECTURE.md`
 * → `premiumEntitlements` — "placeholder collection for the future Premium
 * tier"). Server Settings only ever *reads* this collection to show status;
 * nothing in this dashboard writes to it. Entitlements will eventually be
 * granted by a billing webhook/admin tool that this repo doesn't own.
 */

/** Raw shape of a document in the (mostly still-empty) `premiumEntitlements`
 * collection, one per guild, once that system exists. */
export interface PremiumEntitlementDocument {
  guildId: string;
  active: boolean;
  plan?: string;
  expiresAt?: Date | null;
}

/** JSON-safe shape returned by the API / rendered in the UI. */
export interface PremiumStatus {
  active: boolean;
  plan: string | null;
  /** ISO 8601 string, or null if not active / no expiry set. */
  expiresAt: string | null;
}

export const DEFAULT_PREMIUM_STATUS: PremiumStatus = {
  active: false,
  plan: null,
  expiresAt: null,
};

/** Static marketing copy for the "what you'd get" preview — no data behind
 * this yet, purely informational until the Premium feature is built. */
export const PREMIUM_FEATURES_PREVIEW: string[] = [
  "Custom AI personality presets",
  "Priority AI response speed",
  "Extended AI memory retention",
  "Advanced analytics & data export",
  "Priority support",
];
