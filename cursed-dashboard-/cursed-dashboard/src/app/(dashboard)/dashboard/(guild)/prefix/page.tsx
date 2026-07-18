import { redirect } from "next/navigation";
import { ServerCrash } from "lucide-react";
import { PrefixEditor } from "@/components/prefix/prefix-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { PrefixData } from "@/types/prefix";

export default async function PrefixPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/prefix`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Command Prefix"
          description="Choose the text prefix members use for CURSED commands."
        />
        <EmptyState
          icon={ServerCrash}
          title={error?.code === "BOT_NOT_IN_GUILD" ? "CURSED is not added to this server" : "Prefix settings unavailable"}
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as PrefixData;
  return (
    <div>
      <PageHeader
        title="Command Prefix"
        description="Choose the text prefix members use for CURSED commands."
      />
      <PrefixEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
