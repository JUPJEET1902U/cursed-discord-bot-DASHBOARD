import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Historical trends from persisted bot metrics."
      />
      <ComingSoon
        icon={BarChart3}
        feature="Analytics"
        note="Not enough historical data is persisted yet. No charts or totals are fabricated."
      />
    </div>
  );
}
