import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { AISettingsEditor } from "@/components/ai-settings/ai-settings-editor";
import { requireSelectedGuild } from "@/lib/guild";
import { fetchInternal } from "@/lib/api";
import {
  DEFAULT_AI_SETTINGS_CONFIG,
  type AISettingsConfig,
} from "@/types/ai-settings";

/**
 * Server component: re-verifies the active guild (same guard the layout
 * already ran), then calls this app's own `GET /api/guilds/[guildId]/ai-settings`
 * — never MongoDB directly — to load the current config before handing off
 * to the client-side editor. Same pattern as Welcome/Autorole.
 */
export default async function AISettingsPage() {
  const guild = await requireSelectedGuild();

  const res = await fetchInternal(`/api/guilds/${guild.id}/ai-settings`);

  // The layout already verified this guild moments ago, so a 401/403 here
  // would mean the session changed mid-request — safest to bounce back to
  // server selection rather than show a broken page.
  if (res.status === 401 || res.status === 403) {
    redirect("/dashboard");
  }
  if (!res.ok) {
    throw new Error("Couldn't load AI settings.");
  }

  const data = (await res.json()) as { config: AISettingsConfig };

  return (
    <div>
      <PageHeader
        title="AI Settings"
        breadcrumb="AI Settings"
        description="Choose and configure this server's AI provider."
      />
      <AISettingsEditor
        guildId={guild.id}
        initialConfig={data.config ?? DEFAULT_AI_SETTINGS_CONFIG}
      />
    </div>
  );
}
