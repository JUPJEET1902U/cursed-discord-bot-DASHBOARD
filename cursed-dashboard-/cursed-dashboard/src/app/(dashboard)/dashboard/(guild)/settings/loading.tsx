import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <LoadingSkeleton className="h-3 w-28" />
      <LoadingSkeleton className="h-10 w-full" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div>
      <PageHeader
        title="Server Settings"
        breadcrumb="Server Settings"
        description="General configuration for CURSED in this server."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <DashboardCard>
            <div className="space-y-5">
              <FieldSkeleton />
              <div className="grid grid-cols-2 gap-5">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </div>
          </DashboardCard>
          <DashboardCard>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <LoadingSkeleton className="h-3.5 w-32" />
                  <LoadingSkeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <DashboardCard>
            <div className="space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </DashboardCard>
          <DashboardCard>
            <LoadingSkeleton className="h-16 w-full rounded-xl" />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
