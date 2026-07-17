import { redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { ControlCenterEditor } from "@/components/settings/control-center-editor";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { ControlCenterData } from "@/types/control-center";

export default async function ServerSettingsPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/control-center`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Control Center"
          breadcrumb="Control Center"
          description="Manage CURSED's live server features from one place."
        />
        <EmptyState
          icon={SlidersHorizontal}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Control center unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as ControlCenterData;
  return (
    <div>
      <PageHeader
        title="Control Center"
        breadcrumb="Control Center"
        description="AI, commands, channels, moderation, leveling, economy modules, images, games, pets, and premium controls."
      />
      <ControlCenterEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
