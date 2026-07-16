import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AISettingsPage() {
  return (
    <div>
      <PageHeader
        title="AI Settings"
        description="Per-server AI controls are not supported by the live bot yet."
      />
      <ComingSoon
        icon={Bot}
        feature="Per-server AI settings"
        note="CURSED's provider fallback remains active, but there is no per-server AI configuration to edit safely yet."
      />
    </div>
  );
}
