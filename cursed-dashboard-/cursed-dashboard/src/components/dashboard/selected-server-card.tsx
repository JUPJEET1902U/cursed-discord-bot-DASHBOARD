"use client";

import { Server } from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import { StatCard } from "@/components/dashboard/stat-card";

/**
 * The one Overview tile that needs the active guild's own data (its name).
 * Reads it from GuildContext instead of re-fetching or accepting it as a
 * prop — this is what the context is for: any Client Component anywhere
 * in the guild dashboard tree can do this same one-line read.
 */
export function SelectedServerCard() {
  const guild = useGuild();
  return (
    <StatCard
      icon={Server}
      label="Selected server"
      value={guild.name}
      hint={guild.owner ? "Owner" : "Manager"}
      tone="neutral"
      glow="crimson"
    />
  );
}
