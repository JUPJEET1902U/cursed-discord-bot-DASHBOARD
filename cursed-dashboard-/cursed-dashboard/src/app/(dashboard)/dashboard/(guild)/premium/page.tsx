import { Crown } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function PremiumPage() {
  return (
    <div>
      <PageHeader
        title="Premium"
        description="Upgrade this server for higher limits and extra features."
      />
      <ComingSoon icon={Crown} feature="Premium" />
    </div>
  );
}
