import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function LogsLoading() {
  return (
    <div>
      <PageHeader
        title="Logs"
        description="Send an event log to a channel whenever something happens in this server."
      />
      <div className="max-w-3xl space-y-6">
        <DashboardCard>
          <LoadingSkeleton className="h-4 w-64" />
        </DashboardCard>
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCard key={i}>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] px-4 py-3.5"
                >
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-3.5 w-32" />
                    <LoadingSkeleton className="h-3 w-48" />
                  </div>
                  <LoadingSkeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
