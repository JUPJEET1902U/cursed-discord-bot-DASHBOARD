import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { SignOutButton } from "@/components/shared/sign-out-button";

/**
 * The server-selection page (`dashboard/page.tsx`) is the one dashboard
 * screen that intentionally has no sidebar or guild switcher — there's no
 * guild yet. This gives it its own lightweight header instead of
 * borrowing chrome meant for guild-scoped pages.
 */
export async function SelectionShell({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div>
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <CursedLogo size={28} animated={false} />
            <span className="font-display font-semibold tracking-wide text-fog">
              CURSED
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user?.name ? (
              <span className="text-sm text-ash">{session.user.name}</span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
