import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface ComingSoonProps {
  icon?: LucideIcon;
  feature: string;
  note?: string;
}

/**
 * Placeholder body for every sidebar page whose logic isn't built yet.
 * Swap this out for the real feature UI page-by-page — nothing else about
 * the page (PageHeader, layout, nav) needs to change when that happens.
 */
export function ComingSoon({ icon: Icon = Sparkles, feature, note }: ComingSoonProps) {
  return (
    <EmptyState
      icon={Icon}
      title={`${feature} is coming soon`}
      description={
        note ??
        "This page is scaffolded and wired into the dashboard shell — the feature itself lands in a later step."
      }
    />
  );
}
