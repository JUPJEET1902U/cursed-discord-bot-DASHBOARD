import { redirect } from "next/navigation";
import { CakeSlice, ServerCrash } from "lucide-react";
import { BirthdayEditor } from "@/components/birthdays/birthday-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { BirthdaysData } from "@/types/birthdays";

export default async function BirthdaysPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/birthdays`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Birthdays"
          description="Remember member birthdays, send DMs, and announce them only inside this server."
        />
        <EmptyState
          icon={error?.code === "BOT_NOT_IN_GUILD" ? ServerCrash : CakeSlice}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Birthday settings unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as BirthdaysData;
  return (
    <div>
      <PageHeader
        title="Birthdays"
        description="Remember member birthdays, send DMs, and announce them only inside this server."
      />
      <BirthdayEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
