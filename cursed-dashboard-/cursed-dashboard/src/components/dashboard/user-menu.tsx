"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Client-safe account menu; session and sign-out behavior are unchanged. */
export function UserMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Account";
  const image = session?.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group relative flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet/50">
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet/40 to-crimson/25 opacity-0 blur-md transition-opacity group-hover:opacity-70" />
        {image ? (
          <Image
            src={image}
            alt=""
            width={34}
            height={34}
            className="relative h-[34px] w-[34px] rounded-full object-cover ring-2 ring-white/10 transition-all group-hover:ring-violet/45"
          />
        ) : (
          <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-ash transition-all group-hover:border-violet/35 group-hover:text-fog">
            <User className="h-4 w-4" />
          </div>
        )}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#111118] bg-emerald-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium text-fog">{name}</span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.16em] text-ash">Dashboard account</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })} className="focus:bg-crimson/[0.08] focus:text-crimson-bright">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
