"use client";

import { motion } from "framer-motion";
import { Bot, Database, ShieldCheck } from "lucide-react";

const safeguards = [
  {
    icon: ShieldCheck,
    title: "Discord permission gate",
    description:
      "The server verifies the authenticated Discord account and Manage Server permission for every protected request.",
  },
  {
    icon: Bot,
    title: "Railway bot API",
    description:
      "Vercel calls the live bot over an authenticated server-to-server API; private credentials never enter the browser.",
  },
  {
    icon: Database,
    title: "One guild document",
    description:
      "Welcome and Autorole updates patch only their exact fields and preserve every unrelated guild setting.",
  },
];

export function ProductionConnection() {
  return (
    <section className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-fog">
            Connected without exposing secrets
          </h2>
          <p className="mt-4 text-ash">
            Guild access, bot state, and configuration writes stay behind
            authenticated server routes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {safeguards.map((safeguard, i) => (
            <motion.div
              key={safeguard.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <safeguard.icon className="h-5 w-5 text-violet-bright mb-4" />
              <h3 className="font-display font-medium text-fog mb-2">
                {safeguard.title}
              </h3>
              <p className="text-sm text-ash leading-relaxed">
                {safeguard.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
