"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  DoorOpen,
  UserCog,
  ScrollText,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Moderation & AutoMod",
    description:
      "Anti-spam, anti-invite, caps and mention filters with configurable warn / timeout / kick / ban escalation.",
  },
  {
    icon: Sparkles,
    title: "8 AI personalities",
    description:
      "From Friendly to Chaos to Pirate — pick a personality per channel, tune temperature, memory, and response length.",
  },
  {
    icon: DoorOpen,
    title: "Welcome & goodbye flows",
    description:
      "Embed builder with live preview and placeholders like {user}, {mention}, {server}, {membercount}.",
  },
  {
    icon: UserCog,
    title: "Smart autorole",
    description:
      "Delay, bot-ignore, human-only, and role-hierarchy validation baked in — no accidental permission escalation.",
  },
  {
    icon: ScrollText,
    title: "Full audit logging",
    description:
      "Member, message, voice, role, channel, and moderation logs routed to whichever channels you choose.",
  },
  {
    icon: BarChart3,
    title: "Server analytics",
    description:
      "Commands used, AI requests, member growth, and moderation actions — charted, not buried in a CSV.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-fog">
            Everything your server needs
          </h2>
          <p className="mt-4 text-ash">
            Six systems, one dashboard. Every change here is written straight to
            the config your bot already reads.
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
