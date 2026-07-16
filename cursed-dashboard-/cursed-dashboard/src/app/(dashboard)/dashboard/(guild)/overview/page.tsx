import { redirect } from "next/navigation";
import {
  Bot,
  Clock,
  Database,
  Radio,
  ServerCrash,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SelectedServerCard } from "@/components/dashboard/selected-server-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { BotOverviewData } from "@/types/bot-api";

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return "Not available";
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function providerLabel(providers: BotOverviewData["aiProviders"]): string {
  const available = [
    providers.gemini ? "Gemini" : null,
    providers.groq ? "Groq" : null,
    providers.openRouter ? "OpenRouter" : null,
  ].filter((provider): provider is string => Boolean(provider));
  return available.length > 0 ? available.join(", ") : "Not configured";
}

export default async function OverviewPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/overview`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    const botMissing = error?.code === "BOT_NOT_IN_GUILD";
    return (
      <div>
        <PageHeader
          title="Overview"
          description="Live bot status and activity for this server."
        />
        <EmptyState
          icon={ServerCrash}
          title={botMissing ? "CURSED is not added to this server" : "Live data unavailable"}
          description={error?.error ?? "The Railway bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const { data } = (await response.json()) as { data: BotOverviewData };
  const activity = data.activity;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Live bot status and activity for this server."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Bot}
          label="Bot status"
          value={data.bot.ready ? "Online" : "Offline"}
          hint={data.bot.presence ?? "Gateway"}
          tone={data.bot.ready ? "positive" : "negative"}
        />
        <StatCard
          icon={Database}
          label="Database status"
          value={data.mongo.connected ? "Connected" : "Unavailable"}
          hint={data.mongo.state}
          tone={data.mongo.connected ? "positive" : "negative"}
        />
        <SelectedServerCard />
        <StatCard
          icon={Sparkles}
          label="AI providers"
          value={providerLabel(data.aiProviders)}
          hint="Availability only"
          tone="neutral"
          glow="crimson"
        />
        <StatCard
          icon={Radio}
          label="WebSocket ping"
          value={data.bot.pingMs === null ? "Not available" : `${Math.round(data.bot.pingMs)}ms`}
          tone={data.bot.pingMs === null ? "warning" : "positive"}
        />
        <StatCard
          icon={Clock}
          label="Bot uptime"
          value={formatDuration(data.bot.uptimeMs)}
          hint="Current process"
          tone="positive"
        />
        <StatCard
          icon={Users}
          label="Member count"
          value={data.guild.memberCount.toLocaleString()}
          hint="Live guild cache"
          glow="crimson"
        />
        <StatCard
          icon={Terminal}
          label="Commands tracked"
          value={activity.available ? activity.totalCommands.toLocaleString() : "Not available"}
          hint={activity.available ? "Since tracking began" : "MongoDB unavailable"}
          glow="crimson"
        />
        <StatCard
          icon={Zap}
          label="Server boosts"
          value={data.guild.boostCount?.toLocaleString() ?? "Not available"}
          hint="Live guild cache"
          glow="crimson"
        />
      </div>

      <div className="mt-6">
        <DashboardCard
          title="Recent activity"
          description="Detailed event history is not persisted by the live bot yet."
        >
          <p className="py-4 text-sm text-ash">No activity data available yet.</p>
        </DashboardCard>
      </div>
    </div>
  );
}
