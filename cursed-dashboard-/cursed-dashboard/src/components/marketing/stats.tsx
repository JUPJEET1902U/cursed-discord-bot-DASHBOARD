"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "Live", label: "Bot presence and status" },
  { value: "Exact", label: "Bot-compatible config fields" },
  { value: "5 sec", label: "Default config refresh" },
  { value: "Private", label: "Server-side credentials" },
];

export function Stats() {
  return (
    <section id="stats" className="relative py-20 px-4 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center"
          >
            <div className="font-mono text-3xl md:text-4xl font-medium text-gradient-cursed">
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-ash">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
