"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  DoorOpen,
  LockKeyhole,
  RefreshCw,
  UserCog,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Live server overview",
    description:
      "See bot presence, latency, uptime, member and boost counts, provider availability, and recorded command activity.",
  },
  {
    icon: DoorOpen,
    title: "Welcome controls",
    description:
      "Choose a usable channel, edit every bot-supported Welcome field, preview placeholders, and save directly to guild config.",
  },
  {
    icon: UserCog,
    title: "Safe autorole",
    description:
      "Select one role the bot can assign, with managed-role and Discord hierarchy restrictions enforced by the live bot.",
  },
  {
    icon: LockKeyhole,
    title: "Permission checked",
    description:
      "Discord sign-in and Manage Server permission are verified before any guild data is read or changed.",
  },
  {
    icon: RefreshCw,
    title: "Shared configuration",
    description:
      "Dashboard updates use the same MongoDB guild document as CURSED, with backward-compatible JSON migration in the bot.",
  },
  {
    icon: Bot,
    title: "Honest feature status",
    description:
      "Pages without a production storage contract are clearly marked unavailable until the bot exposes a compatible API.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-fog">
            Production-connected controls
          </h2>
          <p className="mt-4 text-ash">
            The controls shown as available use live Discord state and the same
            guild configuration CURSED reads in production.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass glass-hover rounded-2xl p-6"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet/20 to-crimson/20 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-violet-bright" />
              </div>
              <h3 className="font-display font-medium text-fog mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-ash leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
