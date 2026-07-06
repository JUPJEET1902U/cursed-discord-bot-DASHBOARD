"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Does the dashboard control the bot directly?",
    a: "No. The dashboard only writes to a shared MongoDB database through its own API. The bot reads its configuration from that same database on its own schedule — the two run as fully separate processes.",
  },
  {
    q: "What permission do I need to access a server's dashboard?",
    a: "You need the Manage Server permission on that Discord server. We check this against Discord's OAuth2 scopes every time you sign in, not just once.",
  },
  {
    q: "Can I switch AI personalities per channel?",
    a: "Yes. AI Settings lets you enable AI per channel and assign one of eight personalities, plus tune memory, temperature, and max response length independently.",
  },
  {
    q: "What happens if I disable a feature — does old data get deleted?",
    a: "No. Disabling a feature (like Welcome or AutoMod) only flips its enabled flag. Your configuration — embed text, channel selection, filters — stays saved for whenever you turn it back on.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes, the core moderation, welcome/goodbye, autorole, and logging systems are free. Premium adds extra AI capacity and upcoming features listed on the Premium page.",
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
