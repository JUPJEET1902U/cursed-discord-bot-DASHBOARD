import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ModerationPage() {
  return (
    <div>
      <PageHeader
        title="Moderation"
        description="Auto-mod rules, warnings, and moderator tools."
      />
      <ComingSoon icon={ShieldCheck} feature="Moderation" />
    </div>
  );
}
