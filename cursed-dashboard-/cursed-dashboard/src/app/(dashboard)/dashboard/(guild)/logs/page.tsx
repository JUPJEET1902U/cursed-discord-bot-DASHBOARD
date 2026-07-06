import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { LogsEditor } from "@/components/logs/logs-editor";
import { requireSelectedGuild } from "@/lib/guild";
import { fetchInternal } from "@/lib/api";
import { DEFAULT_LOGS_CONFIG, type LogsConfig } from "@/types/logs";
import type { DiscordChannel } from "@/types/discord";

/**
 * Server component: re-verifies the active guild, then calls this app's own
 * `GET /api/guilds/[guildId]/logs` — never MongoDB directly — to load the
 * current config before handing off to the client-side editor. Same pattern
 * as Welcome/Autorole.
 */
export default async function LogsPage() {
  const guild = await requireSelectedGuild();

  const res = await fetchInternal(`/api/guilds/${guild.id}/logs`);

  if (res.status === 401 || res.status === 403) {
    redirect("/dashboard");
  }
  if (!res.ok) {
    throw new Error("Couldn't load logging settings.");
  }

  const data = (await res.json()) as {
    config: LogsConfig;
    channels: DiscordChannel[] | null;
  };

  return (
    <div>
      <PageHeader
        title="Logs"
        description="Send an event log to a channel whenever something happens in this server."
      />
      <LogsEditor
        guildId={guild.id}
        initialConfig={data.config ?? DEFAULT_LOGS_CONFIG}
        initialChannels={data.channels}
      />
    </div>
  );
}
