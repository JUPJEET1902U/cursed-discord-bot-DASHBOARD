import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { PageHeader } from "@/components/dashboard/page-header";

export default function ServerSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Server Settings"
        breadcrumb="Server Settings"
        description="General server controls are not connected to the live bot yet."
      />
      <ComingSoon
        icon={Settings}
        feature="General server settings"
        note="This editor will be enabled only after each setting has a matching live bot field."
      />
    </div>
  );
}
