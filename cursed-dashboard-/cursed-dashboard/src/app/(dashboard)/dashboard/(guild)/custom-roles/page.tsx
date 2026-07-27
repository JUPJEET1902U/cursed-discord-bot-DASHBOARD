import { redirect } from "next/navigation";
import { ShieldCheck, ServerCrash } from "lucide-react";
import { CustomRoleEditor } from "@/components/custom-roles/custom-role-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { CustomRoleDashboardData } from "@/types/custom-roles";

export default async function CustomRolesPage() {
  const guild = await requireSelectedGuild();
  const response = await fetchInternal(`/api/guilds/${guild.id}/custom-roles`);

  if (response.status === 401 || response.status === 403) redirect("/dashboard");
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;
    return (
      <div>
        <PageHeader
          title="Custom Roles"
          description="Let trusted members add or remove approved roles with short commands."
        />
        <EmptyState
          icon={error?.code === "BOT_NOT_IN_GUILD" ? ServerCrash : ShieldCheck}
          title={
            error?.code === "BOT_NOT_IN_GUILD"
              ? "CURSED is not added to this server"
              : "Custom role settings unavailable"
          }
          description={error?.error ?? "The live bot API could not be reached."}
          action={<RetryButton />}
        />
      </div>
    );
  }

  const data = (await response.json()) as CustomRoleDashboardData;
  return (
    <div>
      <PageHeader
        title="Custom Roles"
        description="Configure req.role and safe role-toggle commands for this server."
      />
      <CustomRoleEditor guildId={guild.id} initialData={data} />
    </div>
  );
}
