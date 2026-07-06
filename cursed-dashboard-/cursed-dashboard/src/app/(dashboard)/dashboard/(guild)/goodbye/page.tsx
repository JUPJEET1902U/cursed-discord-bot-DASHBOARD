import { DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function GoodbyePage() {
  return (
    <div>
      <PageHeader
        title="Goodbye"
        description="Configure the message CURSED posts when someone leaves."
      />
      <ComingSoon icon={DoorOpen} feature="Goodbye messages" />
    </div>
  );
}
