import { redirect } from "next/navigation";
import { Paintbrush, ServerCrash } from "lucide-react";
import { ServerAppearanceEditor } from "@/components/appearance/server-appearance-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { ServerAppearanceData } from "@/types/server-appearance";

export default async function AppearancePage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/appearance`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Bot Appearance"
          description="Customize how CURSED appears specifically in this Discord server."
        />
        <EmptyState
          icon={error?.code === "BOT_NOT_IN_GUILD" ? ServerCrash : Paintbrush}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Server appearance unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as ServerAppearanceData;
  return (
    <div>
      <PageHeader
        title="Bot Appearance"
        description="Customize CURSED's avatar, banner, and bio for this server without changing its global profile."
      />
      <ServerAppearanceEditor
        guildId={guild.id}
        guildName={guild.name}
        initialData={data}
      />
    </div>
  );
}
