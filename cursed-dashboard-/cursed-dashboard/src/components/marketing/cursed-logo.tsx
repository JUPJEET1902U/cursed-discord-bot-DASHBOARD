"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CursedLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * The CURSED mark: a corrupted eye rendered from two mismatched arcs
 * (violet + crimson) that never quite align — the "glitch" is baked into
 * the geometry, not just a hover effect. On hover, the two arcs separate
 * further and re-converge, like a signal losing and regaining lock.
 */
export function CursedLogo({ size = 40, className, animated = true }: CursedLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        whileHover={animated ? "glitch" : undefined}
        initial="rest"
      >
        {/* crimson arc — offset outline */}
        <motion.path
          d="M4 20C4 20 12 9 20 9C28 9 36 20 36 20"
          stroke="#DC143C"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={{
            rest: { x: 0.6, y: -0.4, opacity: 0.85 },
            glitch: { x: [0.6, -1.4, 1.8, 0.6], y: [-0.4, 0.6, -0.6, -0.4], opacity: [0.85, 1, 0.7, 0.85] },
          }}
          transition={{ duration: 0.5 }}
        />
        {/* violet arc — offset outline */}
        <motion.path
          d="M4 20C4 20 12 31 20 31C28 31 36 20 36 20"
          stroke="#7C3AED"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={{
            rest: { x: -0.6, y: 0.4, opacity: 0.85 },
            glitch: { x: [-0.6, 1.4, -1.8, -0.6], y: [0.4, -0.6, 0.6, 0.4], opacity: [0.85, 0.7, 1, 0.85] },
          }}
          transition={{ duration: 0.5 }}
        />
        {/* iris */}
        <motion.circle
          cx="20"
          cy="20"
          r="5"
          fill="url(#irisGradient)"
          variants={{
            rest: { scale: 1 },
            glitch: { scale: [1, 0.85, 1.1, 1] },
          }}
          transition={{ duration: 0.5 }}
        />
        <circle cx="20" cy="20" r="2" fill="#0A0A0F" />
        <defs>
          <linearGradient id="irisGradient" x1="15" y1="15" x2="25" y2="25">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#DC143C" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
