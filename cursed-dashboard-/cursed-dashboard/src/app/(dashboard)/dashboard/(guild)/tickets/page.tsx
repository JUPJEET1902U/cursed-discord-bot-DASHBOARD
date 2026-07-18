import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ServerCrash } from "lucide-react";
import { TicketEditor } from "@/components/tickets/ticket-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { TicketsData } from "@/types/tickets";

interface TicketsPageProps {
  searchParams: Promise<{ panel?: string }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/tickets`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="CURSED Tickets"
          description="Premium support panels, private tickets, transcripts, workflow automation, and analytics."
        />
        <EmptyState
          icon={ServerCrash}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Ticket settings unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const rawData = (await response.json()) as TicketsData;
  const { panel: requestedPanel } = await searchParams;
  const selectedPanel = rawData.panels.find((panel) => panel._id === requestedPanel);
  const editorData: TicketsData = {
    ...rawData,
    panels:
      requestedPanel === "new"
        ? []
        : selectedPanel
          ? [selectedPanel, ...rawData.panels.filter((panel) => panel._id !== selectedPanel._id)]
          : rawData.panels,
  };

  return (
    <div>
      <PageHeader
        title="CURSED Tickets"
        description="Premium support panels, private tickets, transcripts, workflow automation, and analytics."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 p-3">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-ash">
          Panels
        </span>
        {rawData.panels.map((panel) => {
          const active =
            requestedPanel === panel._id ||
            (!requestedPanel && rawData.panels[0]?._id === panel._id);
          return (
            <Link
              key={panel._id}
              href={`/dashboard/tickets?panel=${panel._id}`}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-violet-bright/60 bg-violet-bright/15 text-violet-100"
                  : "border-white/[0.08] text-ash hover:border-violet-bright/30 hover:text-fog"
              }`}
            >
              {panel.name}
            </Link>
          );
        })}
        <Link
          href="/dashboard/tickets?panel=new"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
            requestedPanel === "new"
              ? "border-violet-bright/60 bg-violet-bright/15 text-violet-100"
              : "border-violet-bright/30 text-violet-200 hover:bg-violet-bright/10"
          }`}
        >
          <Plus className="h-3.5 w-3.5" /> New panel
        </Link>
      </div>

      <TicketEditor guildId={guild.id} initialData={editorData} />
    </div>
  );
}
