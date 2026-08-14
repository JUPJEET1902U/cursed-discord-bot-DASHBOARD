"use client";

import {
  Database,
  Gavel,
  MessageSquareText,
  ShieldAlert,
  TicketCheck,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { LogVisualPreview } from "@/components/logs/log-visual-preview";

export default function LogsPage() {
  return (
    <div>
      <PageHeader
        title="Logs"
        description="A visual guide to the branded event logs CURSED sends directly to Discord."
      />

      <div className="max-w-5xl space-y-6">
        <DashboardCard
          title="CURSED log presentation"
          description="The Discord logging experience now uses one consistent visual system across messages, moderation, security, roles, and tickets."
          icon={MessageSquareText}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-violet/20 bg-violet/[0.055] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-bright">
                Branded
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fog/85">
                CURSED category labels, event titles, thumbnails, and compact metadata.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
                Scannable
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fog/85">
                Important actor, target, before/after, and response details stay visually separated.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
                Discord-first
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fog/85">
                These previews represent Discord embeds; the dashboard does not fabricate event history.
              </p>
            </div>
          </div>
        </DashboardCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <LogVisualPreview
            tone="message"
            icon={MessageSquareText}
            category="Message"
            event="Message Edited"
            description="@member edited a message in #general • Open message"
            details={[
              { label: "Before", value: "old message content" },
              { label: "After", value: "updated message content" },
            ]}
            metadata="User ID • Message ID • Timestamp"
          />

          <LogVisualPreview
            tone="moderation"
            icon={Gavel}
            category="Moderation"
            event="Member Banned"
            description="@member • target account"
            details={[
              { label: "Moderator", value: "@staff" },
              { label: "Reason", value: "Rule violation" },
            ]}
            metadata="Target ID • Moderator ID • Case #"
          />

          <LogVisualPreview
            tone="security"
            icon={ShieldAlert}
            category="Security"
            event="Anti-Nuke Alert"
            description="Suspicious destructive activity was detected and attributed."
            details={[
              { label: "Executor", value: "@actor" },
              { label: "Response", value: "Neutralized / Alerted" },
            ]}
            metadata="Severity • Target • Audit entry"
          />

          <LogVisualPreview
            tone="ticket"
            icon={TicketCheck}
            category="Ticket"
            event="Ticket Closed"
            description="Ticket #0029 • General Support"
            details={[
              { label: "Creator", value: "@member" },
              { label: "Actor", value: "@staff" },
            ]}
            metadata="Ticket # • Priority • Timestamp"
          />
        </div>

        <DashboardCard
          title="No stored dashboard history"
          description="This remains intentionally informational only. CURSED sends the real event logs to configured Discord channels; this dashboard page does not read or persist those messages."
          icon={Database}
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-ash">
            The visual refresh does not change logging behavior, event detection, permissions, API contracts, or storage. It only keeps the dashboard presentation aligned with the Discord log design.
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
