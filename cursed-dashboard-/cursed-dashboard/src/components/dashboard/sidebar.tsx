"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { Route } from "next";
import { Activity, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { cn } from "@/lib/utils";

/** Premium fixed desktop sidebar rendered from the unchanged navigation list. */
export function Sidebar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/[0.07] bg-[#09090e]/82 backdrop-blur-2xl lg:flex">
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-violet/35 to-transparent" />
      <div className="relative flex h-20 items-center gap-3 border-b border-white/[0.065] px-5">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet/25 bg-violet/[0.08] shadow-glow-violet">
          <CursedLogo size={30} animated={false} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#09090e] bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold tracking-[0.18em] text-fog">CURSED</span>
            <Sparkles className="h-3.5 w-3.5 text-violet-bright" />
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-ash">Command Center</p>
        </div>
      </div>

      <div className="px-5 pb-2 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ash/70">Server systems</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              prefetch={false}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "text-fog"
                  : "text-ash hover:translate-x-1 hover:bg-white/[0.035] hover:text-fog"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-violet/30 bg-gradient-to-r from-violet/20 via-violet/[0.09] to-crimson/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_25px_rgba(0,0,0,0.2)]"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              {isActive ? <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-violet-bright shadow-glow-violet" /> : null}
              <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300", isActive ? "border-violet/25 bg-violet/15 text-violet-bright" : "border-transparent bg-white/[0.025] group-hover:border-white/[0.07] group-hover:text-violet-bright")}>
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              <span className="relative z-10 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
          <Activity className="h-4 w-4" />
          Systems operational
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ash">Live controls are connected to CURSED.</p>
      </div>
    </aside>
  );
}
