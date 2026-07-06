import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { AutoroleEditor } from "@/components/autorole/autorole-editor";
import { requireSelectedGuild } from "@/lib/guild";
import { fetchInternal } from "@/lib/api";
import { DEFAULT_AUTOROLE_CONFIG, type AutoroleConfig } from "@/types/autorole";
import type { DiscordRole } from "@/types/discord";

/**
 * Server component: re-verifies the active guild, then calls this app's own
 * `GET /api/guilds/[guildId]/autorole` — never MongoDB directly — to load
 * the current config before handing off to the client-side editor. Same
 * pattern as the Welcome page.
 */
export default async function AutorolePage() {
  const guild = await requireSelectedGuild();

  const res = await fetchInternal(`/api/guilds/${guild.id}/autorole`);

  if (res.status === 401 || res.status === 403) {
    redirect("/dashboard");
  }
  if (!res.ok) {
    throw new Error("Couldn't load autorole settings.");
  }

  const data = (await res.json()) as {
    config: AutoroleConfig;
    roles: DiscordRole[] | null;
    botHighestRolePosition: number | null;
  };

  return (
    <div>
      <PageHeader
        title="Autorole"
        description="Automatically assign roles to new members."
      />
      <AutoroleEditor
        guildId={guild.id}
        initialConfig={data.config ?? DEFAULT_AUTOROLE_CONFIG}
        initialRoles={data.roles}
        initialBotHighestRolePosition={data.botHighestRolePosition}
      />
    </div>
  );
}
