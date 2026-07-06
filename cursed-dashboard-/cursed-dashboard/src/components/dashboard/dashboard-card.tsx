import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Base glass-panel card for dashboard content. StatCard, ComingSoon, and
 * any future feature-page panel should compose this rather than
 * reimplementing the glass/border/padding treatment.
 */
export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h3 className="font-display text-sm font-semibold text-fog">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-ash">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
