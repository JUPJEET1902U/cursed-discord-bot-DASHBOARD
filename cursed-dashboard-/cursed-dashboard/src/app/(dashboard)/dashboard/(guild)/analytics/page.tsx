import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Member growth, message activity, and command usage trends."
      />
      <ComingSoon icon={BarChart3} feature="Analytics" />
    </div>
  );
}
