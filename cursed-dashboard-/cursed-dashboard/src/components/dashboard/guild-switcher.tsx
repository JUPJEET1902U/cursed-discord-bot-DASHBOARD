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
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-lg"
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
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-dim to-crimson-dim text-[11px] font-semibold text-fog">
      {initials || "?"}
    </div>
  );
}

/** Displays the active guild and opens the verified server-selection page. */
export function GuildSwitcher() {
  const guild = useGuild();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="glass glass-hover flex max-w-[13rem] items-center gap-2 rounded-xl px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-violet/60">
        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} />
        <span className="truncate text-sm font-medium text-fog">
          {guild.name}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ash" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[16rem]">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <GuildIcon name={guild.name} iconUrl={guild.iconUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fog">
              {guild.name}
            </p>
            <p className="text-xs text-ash">Active server</p>
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
