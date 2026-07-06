import { LoadingSkeleton, StatCardSkeleton } from "@/components/shared/loading-skeleton";

/**
 * Shown by Next.js while a guild-scoped page's server-side data fetch
 * (guild config, channels, roles, ...) is in flight during navigation.
 * Approximates the common page shape — a header plus a grid of cards —
 * closely enough to avoid a jarring layout shift once the real content
 * lands, without needing a bespoke skeleton per feature page.
 */
export default function GuildSegmentLoading() {
  return (
    <div>
      <div className="mb-8">
        <LoadingSkeleton className="h-3 w-40" />
        <LoadingSkeleton className="mt-3 h-7 w-48" />
        <LoadingSkeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
