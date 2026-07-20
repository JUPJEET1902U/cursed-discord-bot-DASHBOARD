"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Lightweight ambient layer for the dashboard shell. It only updates CSS
 * variables and never intercepts clicks, so feature controls remain unchanged.
 */
export function DashboardAmbient() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const handlePointer = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
      });
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="dashboard-ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-violet/20 blur-[130px]"
        animate={reduceMotion ? undefined : { x: [0, 50, -15, 0], y: [0, 25, 55, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-48 top-1/4 h-[30rem] w-[30rem] rounded-full bg-crimson/10 blur-[140px]"
        animate={reduceMotion ? undefined : { x: [0, -55, 5, 0], y: [0, 45, -25, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="dashboard-grid absolute inset-0" />
      <div className="dashboard-cursor-light absolute inset-0" />
      <div className="dashboard-vignette absolute inset-0" />
    </div>
  );
}
