"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Does the dashboard control the bot directly?",
    a: "The dashboard calls an authenticated API in the running bot. That API validates live Discord state and updates the same MongoDB guild document the bot reads.",
  },
  {
    q: "What permission do I need to access a server's dashboard?",
    a: "You need the Manage Server permission on that Discord server. We check this against Discord's OAuth2 scopes every time you sign in, not just once.",
  },
  {
    q: "Which settings are available now?",
    a: "Welcome and Autorole are production-connected. Other settings pages clearly show that they are unavailable until the bot exposes a compatible API and storage contract.",
  },
  {
    q: "What happens when I disable Welcome?",
    a: "The selected welcome channel is cleared, which disables delivery. The supported message and appearance fields remain available for the next time Welcome is enabled.",
  },
  {
    q: "How quickly does the bot see a saved change?",
    a: "The bot refreshes cached guild configuration on a five-second interval by default. Deployments can tune that interval with GUILD_CONFIG_REFRESH_MS.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-semibold text-fog text-center mb-12">
          Frequently asked
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-fog text-sm">{faq.q}</span>
                  <Plus
                    className={cn(
                      "h-4 w-4 text-violet-bright flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-45"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-ash leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
