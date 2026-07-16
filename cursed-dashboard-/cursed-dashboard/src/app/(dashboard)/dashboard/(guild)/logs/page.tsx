import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function LogsPage() {
  return (
    <div>
      <PageHeader title="Logs" description="Stored event history for this server." />
      <EmptyState
        icon={ScrollText}
        title="No stored logs available"
        description="CURSED can send moderation messages to Discord, but it does not persist a dashboard-readable event log yet."
      />
    </div>
  );
}
