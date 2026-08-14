import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function LogsLoading() {
  return (
    <div>
      <PageHeader
        title="Logs"
        description="A visual guide to the branded event logs CURSED sends directly to Discord."
      />
      <div className="max-w-5xl space-y-6">
        <DashboardCard>
          <div className="space-y-4">
            <LoadingSkeleton className="h-4 w-56" />
            <LoadingSkeleton className="h-3 w-full max-w-2xl" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </DashboardCard>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LoadingSkeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-2.5 w-28" />
                    <LoadingSkeleton className="h-3.5 w-40" />
                  </div>
                </div>
                <LoadingSkeleton className="h-5 w-14 rounded-full" />
              </div>
              <LoadingSkeleton className="mt-5 h-3 w-4/5" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <LoadingSkeleton className="h-14 rounded-xl" />
                <LoadingSkeleton className="h-14 rounded-xl" />
              </div>
              <LoadingSkeleton className="mt-4 h-2.5 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
