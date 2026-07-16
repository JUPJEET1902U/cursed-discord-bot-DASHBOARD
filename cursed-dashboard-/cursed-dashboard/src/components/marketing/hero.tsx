"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CursedLogo } from "./cursed-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-28 px-4">
      {/* ambient background */}
      <div className="absolute inset-0 bg-cursed-glow" />
      <div className="absolute inset-0 bg-cursed-grid bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <CursedLogo size={72} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-ash mb-6"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-bright animate-pulse-glow" />
          Live dashboard controls for CURSED
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-5xl md:text-7xl font-display font-semibold tracking-tight leading-[1.05] text-fog"
        >
          The Ultimate<br />
          <span className="text-gradient-cursed">AI Discord Bot</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-lg text-ash max-w-2xl mx-auto"
        >
          Manage Welcome and Autorole settings through permission-checked controls
          connected directly to the configuration your bot reads.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" variant="primary" asChild>
            <Link href="/invite">
              Invite Bot <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs">
              <BookOpen className="h-4 w-4" /> Documentation
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
