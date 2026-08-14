import { redirect } from "next/navigation";
import { ScrollText, ServerCrash } from "lucide-react";
import { LogsEditor } from "@/components/logs/logs-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { LogsDashboardData } from "@/types/logs";

export default async function LogsPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/logs`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;

    return (
      <div>
        <PageHeader
          title="Logs"
          description="Choose every event CURSED should log and exactly where it should be sent."
        />
        <EmptyState
          icon={error?.code === "BOT_NOT_IN_GUILD" ? ServerCrash : ScrollText}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Logging settings unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as LogsDashboardData;

  return (
    <div>
      <PageHeader
        title="Logs"
        description="Control member, message, role, channel, voice, server, moderation, security, and ticket logs from one place."
      />
      <LogsEditor
        guildId={guild.id}
        initialConfig={data.config}
        initialChannels={data.channels}
      />
    </div>
  );
}
