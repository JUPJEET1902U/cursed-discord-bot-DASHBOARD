import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus, ServerCrash } from "lucide-react";
import { selectServer } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ManageableGuild } from "@/types/discord";

interface ServerCardProps {
  guild: ManageableGuild;
  isSelected: boolean;
}

function GuildFallbackIcon({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-dim to-crimson-dim font-display text-sm font-semibold text-fog">
      {initials || "?"}
    </div>
  );
}

function ServerIdentity({ guild }: { guild: ManageableGuild }) {
  return (
    <>
      {guild.iconUrl ? (
        <Image
          src={guild.iconUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-xl"
        />
      ) : (
        <GuildFallbackIcon name={guild.name} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fog">{guild.name}</p>
        <p className="text-xs text-ash">
          {guild.owner ? "Owner" : "Manage Server"}
          {guild.botIsMember === false ? " / CURSED not added" : null}
          {guild.botIsMember === null ? " / Bot status unavailable" : null}
        </p>
      </div>
    </>
  );
}

export function ServerCard({ guild, isSelected }: ServerCardProps) {
  const cardClass = cn(
    "glass flex w-full items-center gap-4 rounded-xl p-4 text-left",
    isSelected && "border-violet/60 bg-violet/[0.08]"
  );

  if (guild.botIsMember === false) {
    const inviteHref = `/invite?guildId=${guild.id}` as Route;
    return (
      <div className={cardClass}>
        <ServerIdentity guild={guild} />
        <Button asChild size="sm">
          <Link href={inviteHref}>
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>
    );
  }

  if (guild.botIsMember === null) {
    return (
      <div className={cardClass}>
        <ServerIdentity guild={guild} />
        <ServerCrash className="h-5 w-5 shrink-0 text-amber-300" />
      </div>
    );
  }

  return (
    <form action={selectServer}>
      <input type="hidden" name="guildId" value={guild.id} />
      <button
        type="submit"
        className={cn(cardClass, "glass-hover group transition-all")}
      >
        <ServerIdentity guild={guild} />
        <span
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isSelected
              ? "bg-violet text-white"
              : "bg-white/[0.04] text-ash group-hover:text-fog"
          )}
        >
          {isSelected ? "Selected" : "Select"}
        </span>
      </button>
    </form>
  );
}
