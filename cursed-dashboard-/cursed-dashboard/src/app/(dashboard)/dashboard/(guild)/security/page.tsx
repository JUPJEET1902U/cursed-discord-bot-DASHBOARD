import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { SecurityEditor } from "@/components/security/security-editor";
import { SecurityRecoverySuite } from "@/components/security/security-recovery-suite";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { SecurityData } from "@/types/security";
import type { SecuritySuiteData } from "@/types/security-suite";

function coreSecurityData(data: SecurityData): SecurityData {
  const config = data.config;
  return {
    ...data,
    config: {
      enabled: config.enabled,
      securityLogChannelId: config.securityLogChannelId,
      antiRaid: {
        enabled: config.antiRaid.enabled,
        joinThreshold: config.antiRaid.joinThreshold,
        windowSeconds: config.antiRaid.windowSeconds,
        minAccountAgeHours: config.antiRaid.minAccountAgeHours,
        action: config.antiRaid.action,
        activeRaidSeconds: config.antiRaid.activeRaidSeconds,
      },
      antiNuke: {
        ...config.antiNuke,
        thresholds: { ...config.antiNuke.thresholds },
      },
      messageShield: { ...config.messageShield },
      quarantine: { ...config.quarantine },
      lockdown: {
        ...config.lockdown,
        channelIds: [...config.lockdown.channelIds],
      },
      trusted: {
        enabled: config.trusted.enabled,
        entries: config.trusted.entries.map((entry) => ({
          subjectType: entry.subjectType,
          subjectId: entry.subjectId,
          scopes: [...entry.scopes],
        })),
      },
    },
  };
}

export default async function SecurityPage() {
  const guild = await requireSelectedGuild();
  const [response, suiteResponse] = await Promise.all([
    fetchInternal(`/api/guilds/${guild.id}/security`),
    fetchInternal(`/api/guilds/${guild.id}/security-suite`),
  ]);

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

  const data = coreSecurityData((await response.json()) as SecurityData);
  const suiteData = suiteResponse.ok
    ? (await suiteResponse.json()) as SecuritySuiteData
    : null;
  let suiteError = "Deploy Bot PR #55 before using the Security Recovery Suite dashboard controls.";
  if (!suiteData) {
    const errorBody = (await suiteResponse.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error) suiteError = errorBody.error;
  }

  return (
    <div>
      <PageHeader
        title="Server Protection"
        breadcrumb="Server Protection"
        description="Configure anti-raid, anti-nuke, recovery snapshots, tamper protection, incident mode, staff limits and forensic reporting."
      />
      <SecurityEditor guildId={guild.id} initialData={data} />
      {suiteData ? (
        <SecurityRecoverySuite guildId={guild.id} initialData={suiteData} />
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={ShieldAlert}
            title="Security Recovery Suite unavailable"
            description={suiteError}
            action={<RetryButton />}
          />
        </div>
      )}
    </div>
  );
}