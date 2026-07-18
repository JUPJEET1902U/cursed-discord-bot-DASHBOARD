import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PartyPopper,
  Drama,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Siren,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Guild-scoped dashboard navigation. Only pages backed by the live Railway bot
 * API are shown, so users never land on controls that cannot save anything.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Control Center", href: "/dashboard/settings", icon: SlidersHorizontal },
  { label: "Moderation", href: "/dashboard/moderation", icon: ShieldCheck },
  { label: "Advanced Moderation", href: "/dashboard/moderation-advanced", icon: ShieldAlert },
  { label: "Server Protection", href: "/dashboard/security", icon: Siren },
  { label: "Welcome", href: "/dashboard/welcome", icon: PartyPopper },
  { label: "Autorole", href: "/dashboard/autorole", icon: Drama },
];
