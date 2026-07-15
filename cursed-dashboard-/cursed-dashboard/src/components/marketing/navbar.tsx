"use client";

import Link from "next/link";
import { CursedLogo } from "./cursed-logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Servers" },
  { href: "#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
] as const;

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="mx-auto max-w-6xl mt-4 px-4">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <CursedLogo size={30} />
            <span className="font-display font-semibold tracking-wide text-fog">
              CURSED
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm text-ash hover:text-fog transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Dashboard</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/invite">Add to Discord</Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
