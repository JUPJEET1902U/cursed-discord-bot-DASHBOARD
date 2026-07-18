import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { SecurityEditor } from "@/components/security/security-editor";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { SecurityData } from "@/types/security";

export default async function SecurityPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/security`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Server Protection"
          breadcrumb="Server Protection"
          description="Anti-raid, anti-nuke, quarantine, emergency recovery, and granular trust rules."
        />
        <EmptyState
          icon={ShieldAlert}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Server Protection unavailable"
          }
          description={error?.error ?? "The live Phase 3 protection API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as SecurityData;
  return (
    <div>
      <PageHeader
        title="Server Protection"
        breadcrumb="Server Protection"
        description="Configure anti-raid and anti-nuke thresholds, quarantine recovery, emergency lockdown, trusted scopes, and incident handling."
      />
      <SecurityEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
