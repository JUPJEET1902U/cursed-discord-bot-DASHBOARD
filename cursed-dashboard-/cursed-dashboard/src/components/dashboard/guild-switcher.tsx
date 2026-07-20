"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronsUpDown, RefreshCw } from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function GuildIcon({ name, iconUrl }: { name: string; iconUrl: string | null }) {
  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt=""
        width={30}
        height={30}
        className="h-[30px] w-[30px] shrink-0 rounded-xl object-cover ring-1 ring-white/10"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-xl border border-violet/25 bg-gradient-to-br from-violet-dim to-crimson-dim text-[11px] font-semibold text-fog shadow-[0_0_18px_rgba(124,58,237,0.2)]">
      {initials || "?"}
    </div>
  );
}

/** Displays the active guild and opens the verified server-selection page. */
export function GuildSwitcher() {
  const guild = useGuild();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 max-w-[15rem] items-center gap-2 rounded-xl border border-white/[0.075] bg-white/[0.035] px-2.5 py-1.5 outline-none backdrop-blur-xl transition-all hover:border-violet/30 hover:bg-violet/[0.07] focus-visible:ring-2 focus-visible:ring-violet/40">
        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} />
        <div className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-xs font-medium text-fog">{guild.name}</span>
          <span className="block text-[10px] text-ash">Active server</span>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ash" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[17rem]">
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <GuildIcon name={guild.name} iconUrl={guild.iconUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fog">{guild.name}</p>
            <p className="text-xs text-emerald-300">Connected to CURSED</p>
          </div>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" prefetch={false}>
            <RefreshCw className="h-4 w-4" />
            Switch server
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
