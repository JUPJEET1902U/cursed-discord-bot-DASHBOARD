"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

// Placeholder testimonials — swap for real quotes once collected.
const testimonials = [
  {
    quote:
      "Switched our mod stack over in an afternoon. The escalation ladder for warns to bans finally matches how we actually run the server.",
    name: "Ariadne",
    role: "Admin, Nightfall Studios",
  },
  {
    quote:
      "The AI personality toggle per channel is the feature I didn't know I needed — Chaos mode in #memes, Wise mode in #help.",
    name: "Kestrel",
    role: "Owner, Ember Collective",
  },
  {
    quote:
      "Analytics finally gave us a real growth chart instead of guessing from Discord's built-in insights.",
    name: "Dorian",
    role: "Community Lead, Fault Line",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-fog">
            Trusted by server staff
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-violet-bright text-violet-bright" />
                ))}
              </div>
              <blockquote className="text-sm text-fog/90 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="text-fog font-medium">{t.name}</span>
                <span className="text-ash"> — {t.role}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
