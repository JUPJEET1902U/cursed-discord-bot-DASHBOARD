import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PartyPopper,
  Drama,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Command,
  Headphones,
  Crown,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

/** Guild-scoped pages backed by the live Railway bot API. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Control Center", href: "/dashboard/settings", icon: SlidersHorizontal },
  { label: "Command Prefix", href: "/dashboard/prefix", icon: Command },
  { label: "Tickets", href: "/dashboard/tickets", icon: Headphones },
  { label: "Moderation", href: "/dashboard/moderation", icon: ShieldCheck },
  { label: "Advanced Moderation", href: "/dashboard/moderation-advanced", icon: ShieldAlert },
  { label: "Server Protection", href: "/dashboard/security", icon: Siren },
  { label: "Welcome", href: "/dashboard/welcome", icon: PartyPopper },
  { label: "Autorole", href: "/dashboard/autorole", icon: Drama },
  { label: "Premium & Billing", href: "/dashboard/premium", icon: Crown, ownerOnly: true },
];
