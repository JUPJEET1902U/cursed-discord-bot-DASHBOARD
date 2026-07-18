"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ash hover:bg-white/[0.06] hover:text-fog lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={reduceMotion ? false : { x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={
                  reduceMotion
                    ? { duration: 0.001 }
                    : { type: "spring", stiffness: 320, damping: 34 }
                }
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.06] bg-ink outline-none lg:hidden"
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Links to every guild-scoped dashboard page.
                </Dialog.Description>
                <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
                  <div className="flex items-center gap-2.5">
                    <CursedLogo size={26} animated={false} />
                    <span className="font-display font-semibold tracking-wide text-fog">
                      CURSED
                    </span>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close navigation"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ash hover:bg-white/[0.06] hover:text-fog"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href as Route}
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gradient-to-r from-violet/20 to-crimson/10 text-fog ring-1 ring-violet/30"
                            : "text-ash hover:bg-white/[0.04] hover:text-fog"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
