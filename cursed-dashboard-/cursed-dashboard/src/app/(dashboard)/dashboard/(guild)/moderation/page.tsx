import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { ModerationEditor } from "@/components/moderation/moderation-editor";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { ModerationData } from "@/types/moderation";

export default async function ModerationPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/moderation`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Moderation"
          breadcrumb="Moderation"
          description="Permission-safe moderation, AutoMod, warning escalation, and persistent cases."
        />
        <EmptyState
          icon={ShieldCheck}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Moderation controls unavailable"
          }
          description={error?.error ?? "The live moderation API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as ModerationData;
  return (
    <div>
      <PageHeader
        title="Moderation"
        breadcrumb="Moderation"
        description="Configure staff access and protection, then review every persisted moderation case."
      />
      <ModerationEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
