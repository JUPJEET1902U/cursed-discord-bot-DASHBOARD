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

/**
 * Top-bar user menu. Reads the client-safe session via `useSession()` —
 * only `user.id`/`name`/`image` are ever present there (see the `session`
 * callback in `src/lib/auth/config.ts`); the Discord access token never
 * reaches this component.
 */
export function UserMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Account";
  const image = session?.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet/60">
        {image ? (
          <Image
            src={image}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-ash ring-1 ring-white/10">
            <User className="h-4 w-4" />
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
