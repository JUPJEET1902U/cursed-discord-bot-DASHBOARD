"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServerSelectButton({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(className, "relative disabled:cursor-wait disabled:opacity-80")}
    >
      {children}
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-void/90 text-sm font-medium text-fog">
          <Loader2 className="h-4 w-4 animate-spin" />
          Switching server…
        </span>
      ) : null}
    </button>
  );
}
