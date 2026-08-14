import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LogPreviewTone = "message" | "moderation" | "security" | "ticket";

interface LogVisualPreviewProps {
  tone: LogPreviewTone;
  icon: LucideIcon;
  category: string;
  event: string;
  description: string;
  details: Array<{ label: string; value: string }>;
  metadata: string;
}

const toneStyles: Record<
  LogPreviewTone,
  { shell: string; bar: string; icon: string; badge: string }
> = {
  message: {
    shell: "border-violet/25 bg-violet/[0.045]",
    bar: "bg-violet-bright",
    icon: "border-violet/25 bg-violet/[0.10] text-violet-bright",
    badge: "border-violet/20 bg-violet/[0.08] text-violet-bright",
  },
  moderation: {
    shell: "border-rose-500/25 bg-rose-500/[0.035]",
    bar: "bg-rose-500",
    icon: "border-rose-500/25 bg-rose-500/[0.08] text-rose-300",
    badge: "border-rose-500/20 bg-rose-500/[0.07] text-rose-300",
  },
  security: {
    shell: "border-amber-400/25 bg-amber-400/[0.035]",
    bar: "bg-amber-400",
    icon: "border-amber-400/25 bg-amber-400/[0.08] text-amber-300",
    badge: "border-amber-400/20 bg-amber-400/[0.07] text-amber-300",
  },
  ticket: {
    shell: "border-sky-400/25 bg-sky-400/[0.035]",
    bar: "bg-sky-400",
    icon: "border-sky-400/25 bg-sky-400/[0.08] text-sky-300",
    badge: "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",
  },
};

export function LogVisualPreview({
  tone,
  icon: Icon,
  category,
  event,
  description,
  details,
  metadata,
}: LogVisualPreviewProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-4", styles.shell)}>
      <span className={cn("absolute inset-y-0 left-0 w-1", styles.bar)} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("rounded-xl border p-2", styles.icon)}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">
              CURSED • {category} Logs
            </p>
            <h3 className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-fog">
              {event}
            </h3>
          </div>
        </div>
        <span className={cn("rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]", styles.badge)}>
          Preview
        </span>
      </div>

      <p className="mt-4 pl-1 text-xs leading-relaxed text-fog/85">{description}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ash">{detail.label}</p>
            <p className="mt-1 truncate text-xs font-medium text-fog">{detail.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-ash">
        CURSED • {category} Logs • {metadata}
      </p>
    </div>
  );
}
