import { DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function GoodbyePage() {
  return (
    <div>
      <PageHeader
        title="Goodbye"
        description="The live bot does not support goodbye messages yet."
      />
      <ComingSoon
        icon={DoorOpen}
        feature="Goodbye messages"
        note="No goodbye configuration exists in the live bot, so editing stays disabled."
      />
    </div>
  );
}
