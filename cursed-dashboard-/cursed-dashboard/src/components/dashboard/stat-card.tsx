import type { LucideIcon } from "lucide-react";
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
  violet: "bg-violet/10 text-violet-bright",
  crimson: "bg-crimson/10 text-crimson-bright",
  none: "bg-white/[0.06] text-ash",
};

/**
 * A single metric tile: icon, label, big value, optional status hint. Used
 * for Bot Status, Ping, Member Count, etc. on the Overview page — every
 * value here is currently mock data (see `(guild)/overview/page.tsx`);
 * nothing here calls the bot or a database.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
  glow = "violet",
}: StatCardProps) {
  return (
    <div className="glass glass-hover rounded-2xl p-5 transition-transform">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            GLOW_CLASSES[glow]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {hint ? (
          <span className={cn("text-xs font-medium", TONE_CLASSES[tone])}>
            {hint}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-ash">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-fog">
        {value}
      </p>
    </div>
  );
}
