"use client";

import type { PointerEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

/**
 * Premium glass panel with restrained pointer-driven depth. The interaction is
 * visual only and is disabled for touch input and reduced-motion users.
 */
export function DashboardCard({
  title,
  description,
  action,
  icon: Icon,
  children,
  className,
}: DashboardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    const rotateY = (x - 0.5) * 2.4;
    const rotateX = (0.5 - y) * 2.0;

    card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--surface-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--surface-y", `${(y * 100).toFixed(1)}%`);
  }

  function resetTilt() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--surface-x", "50%");
    card.style.setProperty("--surface-y", "50%");
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className={cn("glass glass-hover interactive-surface rounded-2xl p-5", className)}
    >
      <span aria-hidden="true" className="surface-sheen" />
      <div className="relative z-[1]">
        {title || action || Icon ? (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {Icon ? (
                <span className="mt-0.5 rounded-xl border border-violet/20 bg-violet/[0.08] p-2 text-violet-bright">
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <div>
                {title ? (
                  <h3 className="font-display text-sm font-semibold tracking-wide text-fog">
                    {title}
                  </h3>
                ) : null}
                {description ? (
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ash">{description}</p>
                ) : null}
              </div>
            </div>
            {action ? <div className="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2">{action}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
