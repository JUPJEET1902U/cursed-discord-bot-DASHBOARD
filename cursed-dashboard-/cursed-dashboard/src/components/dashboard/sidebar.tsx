"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { Route } from "next";
import { NAV_ITEMS } from "@/lib/nav-config";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { cn } from "@/lib/utils";

/**
 * Fixed desktop sidebar. Renders from `NAV_ITEMS` (src/lib/nav-config.ts)
 * so adding a page to that one list is enough to wire it in here, in
 * MobileNav, and in PageHeader's breadcrumb.
 */
export function Sidebar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-void/80 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <CursedLogo size={26} animated={false} />
        <span className="font-display font-semibold tracking-wide text-fog">
          CURSED
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-fog"
                  : "text-ash hover:bg-white/[0.04] hover:text-fog"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet/20 to-crimson/10 ring-1 ring-violet/30"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 400, damping: 32 }
                  }
                />
              ) : null}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
