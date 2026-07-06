import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

/** A single shimmering placeholder block. Compose multiple for card/list skeletons. */
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.06]",
        className
      )}
    />
  );
}

/** Preset skeleton matching DashboardCard/StatCard's shape, for grid loading states. */
export function StatCardSkeleton() {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-9 w-9 rounded-xl" />
        <LoadingSkeleton className="h-4 w-12" />
      </div>
      <LoadingSkeleton className="h-3 w-20" />
      <LoadingSkeleton className="h-7 w-24" />
    </div>
  );
}
