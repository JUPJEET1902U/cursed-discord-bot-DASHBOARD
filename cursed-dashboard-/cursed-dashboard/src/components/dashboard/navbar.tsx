import { MobileNav } from "@/components/dashboard/mobile-nav";
import { GuildSwitcher } from "@/components/dashboard/guild-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Top bar rendered inside `(guild)/layout.tsx`, to the right of (desktop)
 * or above (mobile) the sidebar. Houses the mobile nav trigger, the guild
 * switcher, and the user menu — the three pieces of chrome every
 * guild-scoped page needs regardless of what the page itself renders.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/[0.06] bg-void/80 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>
      <div className="flex items-center gap-3">
        <GuildSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
