import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}

/** Premium header treatment shared by every guild-scoped dashboard page. */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.065] bg-gradient-to-br from-white/[0.045] via-white/[0.018] to-violet/[0.025] px-5 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
      <div aria-hidden="true" className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-violet/15 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-0 left-16 h-px w-1/2 bg-gradient-to-r from-transparent via-violet/45 to-transparent" />
      <div className="relative z-10">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-ash">
          <Link href="/dashboard/overview" className="transition-colors hover:text-violet-bright">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3 text-violet/70" />
          <span className="text-fog/90">{breadcrumb ?? title}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet/25 bg-violet/10 text-violet-bright">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-gradient-cursed break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
            </div>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ash">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
