import { redirect } from "next/navigation";
import { ServerCrash } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { WelcomeEditor } from "@/components/welcome/welcome-editor";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { DiscordChannel } from "@/types/discord";
import type { WelcomeConfig } from "@/types/welcome";

export default async function WelcomePage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/welcome`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Welcome"
          description="Configure the message CURSED posts when someone joins."
        />
        <EmptyState
          icon={ServerCrash}
          title={error?.code === "BOT_NOT_IN_GUILD" ? "CURSED is not added to this server" : "Welcome settings unavailable"}
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as {
    config: WelcomeConfig;
    channels: DiscordChannel[];
  };

  return (
    <div>
      <PageHeader
        title="Welcome"
        description="Configure the message CURSED posts when someone joins."
      />
      <WelcomeEditor
        guildId={guild.id}
        guildName={guild.name}
        initialConfig={data.config}
        initialChannels={data.channels}
      />
    </div>
  );
}
