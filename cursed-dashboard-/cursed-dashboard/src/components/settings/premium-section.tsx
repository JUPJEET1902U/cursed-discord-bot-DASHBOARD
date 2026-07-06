import { Check, Crown, Sparkles } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PREMIUM_FEATURES_PREVIEW, type PremiumStatus } from "@/types/premium";

interface PremiumSectionProps {
  premium: PremiumStatus;
}

/**
 * Read-only display — no form controls, nothing to save. Premium
 * entitlements will eventually be granted by a billing system this repo
 * doesn't own (see `premiumEntitlements` in `docs/ARCHITECTURE.md`); this
 * dashboard only ever reads that collection, never writes to it.
 */
export function PremiumSection({ premium }: PremiumSectionProps) {
  return (
    <DashboardCard
      title="Premium"
      description="Status and upcoming perks for this server."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className={
                premium.active
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-crimson"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]"
              }
            >
              <Crown
                className={
                  premium.active ? "h-4 w-4 text-white" : "h-4 w-4 text-ash"
                }
              />
            </div>
            <div>
              <p className="text-sm font-medium text-fog">
                {premium.active
                  ? `Premium active${premium.plan ? ` — ${premium.plan}` : ""}`
                  : "Free plan"}
              </p>
              <p className="mt-0.5 text-xs text-ash">
                {premium.active
                  ? premium.expiresAt
                    ? `Renews or expires ${new Date(premium.expiresAt).toLocaleDateString()}`
                    : "No expiry set."
                  : "This server isn't on a premium plan yet."}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-ash">
            <Sparkles className="h-3.5 w-3.5" />
            What premium will include
          </p>
          <ul className="space-y-2">
            {PREMIUM_FEATURES_PREVIEW.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-fog/80"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-bright" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ash">
            Preview only — premium isn&apos;t available to purchase yet.
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
