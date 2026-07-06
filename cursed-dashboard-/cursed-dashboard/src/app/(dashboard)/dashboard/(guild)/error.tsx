"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Catches errors thrown while rendering any page under
 * `(dashboard)/dashboard/(guild)/*` — e.g. `WelcomePage` / `AutorolePage`
 * throwing when their internal `GET /api/guilds/[guildId]/...` fetch
 * fails. Next.js renders this in place of the page while keeping the
 * `(guild)/layout.tsx` shell (Sidebar/Navbar) mounted around it, and
 * `reset()` re-renders the segment without a full navigation.
 */
export default function GuildSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[guild-segment-error]", error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertOctagon}
      title="Something went wrong"
      description="This page hit an unexpected error. Try again, or head back to server selection."
      action={
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
