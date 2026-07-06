"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Catches errors thrown anywhere under `/dashboard` that a more specific
 * boundary (like `(guild)/error.tsx`) doesn't already handle — e.g. the
 * server-selection page itself. `(dashboard)/layout.tsx` renders no chrome
 * of its own, so this intentionally renders a minimal, centered card
 * rather than assuming a Sidebar/Navbar is mounted around it.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <EmptyState
          icon={AlertOctagon}
          title="Something went wrong"
          description="This page hit an unexpected error. Try again in a moment."
          action={
            <Button size="sm" onClick={reset}>
              Try again
            </Button>
          }
        />
      </div>
    </div>
  );
}
