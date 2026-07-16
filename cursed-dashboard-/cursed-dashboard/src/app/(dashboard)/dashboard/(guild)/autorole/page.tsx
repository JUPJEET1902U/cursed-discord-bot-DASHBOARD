import { redirect } from "next/navigation";
import { ServerCrash } from "lucide-react";
import { AutoroleEditor } from "@/components/autorole/autorole-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type {
  AutoroleConfig,
  AutoroleRole,
  CurrentAutoroleRole,
} from "@/types/autorole";

interface AutoroleResponse {
  config: AutoroleConfig;
  roles: AutoroleRole[];
  canManageRoles: boolean;
  currentRole: CurrentAutoroleRole | null;
  unavailableReason: string | null;
}

export default async function AutorolePage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/autorole`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Autorole"
          description="Automatically assign one role to new members."
        />
        <EmptyState
          icon={ServerCrash}
          title={error?.code === "BOT_NOT_IN_GUILD" ? "CURSED is not added to this server" : "Autorole settings unavailable"}
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as AutoroleResponse;
  return (
    <div>
      <PageHeader
        title="Autorole"
        description="Automatically assign one role to new members."
      />
      <AutoroleEditor
        guildId={guild.id}
        initialConfig={data.config}
        initialRoles={data.roles}
        canManageRoles={data.canManageRoles}
        currentRole={data.currentRole}
        unavailableReason={data.unavailableReason}
      />
    </div>
  );
}
