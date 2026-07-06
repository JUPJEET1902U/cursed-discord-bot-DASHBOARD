import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Generic "nothing here" surface. Used for Coming Soon pages, zero-result
 * lists, and error states alike — pass an icon + copy, optionally an
 * action slot (button/link).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass flex flex-col items-center gap-3 rounded-2xl p-10 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10 text-violet-bright">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <p className="font-display text-lg font-medium text-fog">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ash">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
