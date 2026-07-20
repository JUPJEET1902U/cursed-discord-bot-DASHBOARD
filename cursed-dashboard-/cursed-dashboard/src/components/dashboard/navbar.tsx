import { MobileNav } from "@/components/dashboard/mobile-nav";
import { GuildSwitcher } from "@/components/dashboard/guild-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";

/** Floating dashboard chrome. Existing controls and behavior are unchanged. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-20 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="nav-capsule mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-3 rounded-2xl px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <div className="hidden items-center gap-2 text-xs text-ash sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
            Live dashboard
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <GuildSwitcher />
          <div className="h-7 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
