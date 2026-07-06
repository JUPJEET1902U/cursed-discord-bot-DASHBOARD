import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsEditor } from "@/components/settings/settings-editor";
import { requireSelectedGuild } from "@/lib/guild";
import { fetchInternal } from "@/lib/api";
import { DEFAULT_GUILD_SETTINGS, type GuildSettings } from "@/types/guild-settings";
import { DEFAULT_PREMIUM_STATUS, type PremiumStatus } from "@/types/premium";

/**
 * Server component: re-verifies the active guild, then calls this app's own
 * `GET /api/guilds/[guildId]/settings` — never MongoDB directly — to load
 * the current config before handing off to the client-side editor. Same
 * pattern as Welcome/Autorole/AI Settings/Logs.
 */
export default async function ServerSettingsPage() {
  const guild = await requireSelectedGuild();

  const res = await fetchInternal(`/api/guilds/${guild.id}/settings`);

  if (res.status === 401 || res.status === 403) {
    redirect("/dashboard");
  }
  if (!res.ok) {
    throw new Error("Couldn't load server settings.");
  }

  const data = (await res.json()) as {
    config: GuildSettings;
    premium: PremiumStatus;
  };

  return (
    <div>
      <PageHeader
        title="Server Settings"
        breadcrumb="Server Settings"
        description="General configuration for CURSED in this server."
      />
      <SettingsEditor
        guildId={guild.id}
        guildName={guild.name}
        initialConfig={data.config ?? DEFAULT_GUILD_SETTINGS}
        premium={data.premium ?? DEFAULT_PREMIUM_STATUS}
      />
    </div>
  );
}
