import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface ComingSoonProps {
  icon?: LucideIcon;
  feature: string;
  note?: string;
}

export function ComingSoon({
  icon: Icon = Sparkles,
  feature,
  note,
}: ComingSoonProps) {
  return (
    <EmptyState
      icon={Icon}
      title={`${feature} is coming soon`}
      description={
        note ?? "This control is not connected to a supported live bot setting yet."
      }
    />
  );
}
