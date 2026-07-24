"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Route } from "next";
import { Activity, Menu, Sparkles, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || session?.user?.isOwner === true);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-ash transition-all hover:border-violet/30 hover:bg-violet/10 hover:text-fog lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/72 backdrop-blur-md lg:hidden" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={reduceMotion ? false : { x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={reduceMotion ? { duration: 0.001 } : { type: "spring", stiffness: 320, damping: 34 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[88vw] flex-col border-r border-white/[0.08] bg-[#09090e]/95 outline-none backdrop-blur-2xl lg:hidden"
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">Links to every guild-scoped dashboard page.</Dialog.Description>
                <div className="relative flex h-20 items-center justify-between border-b border-white/[0.07] px-5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-violet/25 bg-violet/[0.08] shadow-glow-violet">
                      <CursedLogo size={28} animated={false} />
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#09090e] bg-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2"><span className="font-display font-semibold tracking-[0.16em] text-fog">CURSED</span><Sparkles className="h-3.5 w-3.5 text-violet-bright" /></div>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ash">Command Center</p>
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <button type="button" aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-ash hover:border-crimson/25 hover:bg-crimson/10 hover:text-fog"><X className="h-4 w-4" /></button>
                  </Dialog.Close>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href as Route}
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                          isActive ? "border-violet/30 bg-gradient-to-r from-violet/20 to-crimson/[0.08] text-fog" : "border-transparent text-ash hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-fog"
                        )}
                      >
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", isActive ? "bg-violet/15 text-violet-bright" : "bg-white/[0.025]")}><Icon className="h-4 w-4 shrink-0" /></span>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="m-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-300"><Activity className="h-4 w-4" />Systems operational</div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
