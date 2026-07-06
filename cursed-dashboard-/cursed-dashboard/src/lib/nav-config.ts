import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PartyPopper,
  DoorOpen,
  Drama,
  Bot,
  ShieldCheck,
  ScrollText,
  Settings,
  BarChart3,
  Crown,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for guild-scoped dashboard navigation. Sidebar and
 * MobileNav both render from this list — add a page once here and it shows
 * up in both places consistently. (Each page's `PageHeader` sets its own
 * `title`/`breadcrumb` explicitly rather than deriving it from this list.)
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Welcome", href: "/dashboard/welcome", icon: PartyPopper },
  { label: "Goodbye", href: "/dashboard/goodbye", icon: DoorOpen },
  { label: "Autorole", href: "/dashboard/autorole", icon: Drama },
  { label: "AI Settings", href: "/dashboard/ai-settings", icon: Bot },
  { label: "Moderation", href: "/dashboard/moderation", icon: ShieldCheck },
  { label: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { label: "Server Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Premium", href: "/dashboard/premium", icon: Crown },
];
