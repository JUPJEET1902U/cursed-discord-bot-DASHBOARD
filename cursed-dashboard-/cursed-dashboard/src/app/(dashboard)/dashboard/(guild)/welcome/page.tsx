import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { WelcomeEditor } from "@/components/welcome/welcome-editor";
import { requireSelectedGuild } from "@/lib/guild";
import { fetchInternal } from "@/lib/api";
import { DEFAULT_WELCOME_CONFIG, type WelcomeConfig } from "@/types/welcome";
import type { DiscordChannel } from "@/types/discord";

/**
 * Server component: re-verifies the active guild (same guard the layout
 * already ran), then calls this app's own `GET /api/guilds/[guildId]/welcome`
 * — never MongoDB directly — to load the current config before handing off
 * to the client-side editor. This keeps "who's allowed to read this" logic
 * in exactly one place (the API route), matching every other data fetch in
 * this dashboard.
 */
export default async function WelcomePage() {
  const guild = await requireSelectedGuild();

  const res = await fetchInternal(`/api/guilds/${guild.id}/welcome`);

  // The layout already verified this guild moments ago, so a 401/403 here
  // would mean the session changed mid-request — safest to bounce back to
  // server selection rather than show a broken page.
  if (res.status === 401 || res.status === 403) {
    redirect("/dashboard");
  }
  if (!res.ok) {
    throw new Error("Couldn't load welcome settings.");
  }

  const data = (await res.json()) as {
    config: WelcomeConfig;
    channels: DiscordChannel[] | null;
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
        initialConfig={data.config ?? DEFAULT_WELCOME_CONFIG}
        initialChannels={data.channels}
      />
    </div>
  );
}
