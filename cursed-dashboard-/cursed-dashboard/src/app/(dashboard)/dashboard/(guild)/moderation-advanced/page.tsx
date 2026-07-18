import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { ModerationAdvancedEditor } from "@/components/moderation/moderation-advanced-editor";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { AdvancedModerationData } from "@/types/moderation-advanced";

export default async function AdvancedModerationPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(
    `/api/guilds/${guild.id}/moderation/advanced`
  );

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Advanced Moderation"
          breadcrumb="Advanced Moderation"
          description="Daily moderator tools, restart-safe punishments, detailed logs, and whitelist protection."
        />
        <EmptyState
          icon={ShieldCheck}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Advanced moderation unavailable"
          }
          description={
            error?.error ?? "The live Phase 2 moderation API could not be reached."
          }
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as AdvancedModerationData;
  return (
    <div>
      <PageHeader
        title="Advanced Moderation"
        breadcrumb="Advanced Moderation"
        description="Control purge, locks, temporary bans, softbans, private notes, detailed logging, and trusted whitelist exemptions."
      />
      <ModerationAdvancedEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
