import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}

/**
 * Standard header for every guild-scoped page. Every future feature page
 * (Welcome, Moderation, Analytics, ...) should start with this so titles,
 * spacing, and the breadcrumb trail stay consistent without each page
 * reimplementing them.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-2 flex items-center gap-1.5 text-xs text-ash"
      >
        <Link href="/dashboard/overview" className="hover:text-fog">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-fog">{breadcrumb ?? title}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fog">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-ash">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
