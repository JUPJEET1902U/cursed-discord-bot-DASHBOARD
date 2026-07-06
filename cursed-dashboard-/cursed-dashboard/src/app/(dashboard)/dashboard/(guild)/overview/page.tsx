import {
  Bot,
  Database,
  Sparkles,
  Radio,
  Clock,
  Users,
  Terminal,
  UserPlus,
  ShieldAlert,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SelectedServerCard } from "@/components/dashboard/selected-server-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

/**
 * All values on this page are mock data — nothing here calls the bot
 * process or reads MongoDB (both are explicitly out of scope for this
 * step). Once the bot-status API and DB reads exist, swap these constants
 * for real fetches; the StatCard/DashboardCard layout doesn't need to
 * change.
 */
const MOCK_ACTIVITY = [
  { icon: UserPlus, text: "3 new members joined", time: "12m ago" },
  { icon: ShieldAlert, text: "Auto-mod flagged a message in #general", time: "38m ago" },
  { icon: Settings2, text: "Welcome message template updated", time: "2h ago" },
  { icon: Terminal, text: "/ban used by a moderator", time: "5h ago" },
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="A snapshot of this server's bot status and activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Bot}
          label="Bot status"
          value="Online"
          hint="Mock"
          tone="positive"
          glow="violet"
        />
        <StatCard
          icon={Database}
          label="Database status"
          value="Connected"
          hint="Mock"
          tone="positive"
          glow="violet"
        />
        <SelectedServerCard />
        <StatCard
          icon={Sparkles}
          label="AI provider"
          value="Not configured"
          hint="Mock"
          tone="neutral"
          glow="crimson"
        />
        <StatCard
          icon={Radio}
          label="Ping"
          value="42ms"
          hint="Mock"
          tone="positive"
          glow="violet"
        />
        <StatCard
          icon={Clock}
          label="Uptime"
          value="99.98%"
          hint="Mock · 30d"
          tone="positive"
          glow="violet"
        />
        <StatCard
          icon={Users}
          label="Member count"
          value="1,284"
          hint="Mock"
          tone="neutral"
          glow="crimson"
        />
        <StatCard
          icon={Terminal}
          label="Commands used today"
          value="317"
          hint="Mock"
          tone="neutral"
          glow="crimson"
        />
      </div>

      <div className="mt-6">
        <DashboardCard
          title="Recent activity"
          description="Mock data — live activity lands once the bot integration ships."
        >
          <ul className="divide-y divide-white/[0.06]">
            {MOCK_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-ash">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm text-fog">{item.text}</span>
                  <span className="text-xs text-ash">{item.time}</span>
                </li>
              );
            })}
          </ul>
        </DashboardCard>
      </div>
    </div>
  );
}
