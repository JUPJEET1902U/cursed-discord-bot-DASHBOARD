import type { LucideIcon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

type StatTone = "neutral" | "positive" | "warning" | "negative";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  glow?: "violet" | "crimson" | "none";
}

const TONE_CLASSES: Record<StatTone, string> = {
  neutral: "text-ash",
  positive: "text-emerald-400",
  warning: "text-amber-400",
  negative: "text-crimson-bright",
};

const GLOW_CLASSES: Record<NonNullable<StatCardProps["glow"]>, string> = {
  violet: "border-violet/20 bg-violet/10 text-violet-bright shadow-[0_0_24px_rgba(124,58,237,0.12)]",
  crimson: "border-crimson/20 bg-crimson/10 text-crimson-bright shadow-[0_0_24px_rgba(220,20,60,0.1)]",
  none: "border-white/[0.07] bg-white/[0.04] text-ash",
};

/** A single metric tile with the same premium depth system as feature cards. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
  glow = "violet",
}: StatCardProps) {
  return (
    <DashboardCard className="h-full">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", GLOW_CLASSES[glow])}>
          <Icon className="h-5 w-5" />
        </div>
        {hint ? <span className={cn("text-xs font-medium", TONE_CLASSES[tone])}>{hint}</span> : null}
      </div>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-ash">{label}</p>
      <p className="mt-1.5 break-words font-display text-2xl font-semibold tracking-tight text-fog">{value}</p>
    </DashboardCard>
  );
}
