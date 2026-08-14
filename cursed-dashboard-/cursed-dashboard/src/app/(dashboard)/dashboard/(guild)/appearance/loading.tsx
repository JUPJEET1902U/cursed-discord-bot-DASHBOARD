import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function AppearanceLoading() {
  return (
    <div>
      <PageHeader
        title="Bot Appearance"
        description="Customize how CURSED appears specifically in this Discord server."
      />
      <div className="max-w-6xl space-y-6">
        <LoadingSkeleton className="h-16 rounded-xl" />
        <DashboardCard>
          <LoadingSkeleton className="h-4 w-40" />
          <div className="mt-5 flex justify-center">
            <LoadingSkeleton className="h-24 w-24 rounded-full" />
          </div>
          <LoadingSkeleton className="mt-5 h-11 w-full rounded-xl" />
        </DashboardCard>
        <DashboardCard>
          <LoadingSkeleton className="h-4 w-40" />
          <LoadingSkeleton className="mt-5 aspect-[16/5] w-full rounded-xl" />
          <LoadingSkeleton className="mt-5 h-11 w-full rounded-xl" />
        </DashboardCard>
        <DashboardCard>
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="mt-5 h-28 w-full rounded-xl" />
        </DashboardCard>
      </div>
    </div>
  );
}
