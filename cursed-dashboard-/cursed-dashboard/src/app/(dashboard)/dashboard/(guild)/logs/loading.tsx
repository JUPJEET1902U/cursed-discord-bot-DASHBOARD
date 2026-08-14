import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function LogsLoading() {
  return (
    <div>
      <PageHeader
        title="Logs"
        description="Control member, message, role, channel, voice, server, moderation, security, and ticket logs from one place."
      />
      <div className="max-w-5xl space-y-6">
        <DashboardCard>
          <div className="space-y-4">
            <LoadingSkeleton className="h-4 w-56" />
            <LoadingSkeleton className="h-3 w-full max-w-2xl" />
            <LoadingSkeleton className="h-2 w-full rounded-full" />
          </div>
        </DashboardCard>

        {Array.from({ length: 5 }).map((_, groupIndex) => (
          <DashboardCard key={groupIndex}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <LoadingSkeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-2">
                  <LoadingSkeleton className="h-3.5 w-28" />
                  <LoadingSkeleton className="h-2.5 w-20" />
                </div>
              </div>
              {Array.from({ length: groupIndex === 1 ? 3 : 2 }).map((_, rowIndex) => (
                <LoadingSkeleton key={rowIndex} className="h-20 rounded-2xl" />
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
