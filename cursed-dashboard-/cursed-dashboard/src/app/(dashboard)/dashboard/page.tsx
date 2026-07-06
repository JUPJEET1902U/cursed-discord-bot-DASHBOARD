import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ServerCrash, Users } from "lucide-react";
import { fetchInternal } from "@/lib/api";
import { ServerCard } from "@/components/dashboard/server-card";
import { SelectionShell } from "@/components/dashboard/selection-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { clearSelectedServer } from "./actions";
import { SELECTED_GUILD_COOKIE } from "@/lib/guild";
import type { ManageableGuild } from "@/types/discord";

interface DashboardPageProps {
  searchParams: Promise<{ selected?: string; error?: string }>;
}

const ERROR_COPY: Record<string, string> = {
  invalid_selection: "That selection didn't go through. Try again.",
  fetch_failed: "Couldn't reach Discord to verify that server. Try again.",
  access_denied: "You don't have Manage Server on that server anymore.",
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const previouslySelected = cookieStore.get(SELECTED_GUILD_COOKIE)?.value;

  const res = await fetchInternal("/api/servers");

  if (res.status === 401) {
    // The app session cookie is still technically valid, but the Discord
    // access token behind it has expired or been revoked — every guild
    // fetch will keep failing until the user re-authenticates. Send them
    // straight back to sign-in rather than leaving them stuck on a
    // permanently broken page with no way out.
    redirect("/login?callbackUrl=/dashboard&error=DiscordSessionExpired");
  }

  if (!res.ok) {
    return (
      <SelectionShell>
        <EmptyState
          icon={ServerCrash}
          title="Something went wrong"
          description="Couldn't load your servers from Discord. Try refreshing."
        />
      </SelectionShell>
    );
  }

  const { guilds } = (await res.json()) as { guilds: ManageableGuild[] };

  // Graceful handling of "lost access": if a guild is selected in the
  // cookie but no longer appears in the freshly-fetched manageable list
  // (kicked from the server, lost Manage Server, etc.), clear it instead
  // of letting a later page silently trust a stale selection.
  const stillHasAccess =
    !!previouslySelected && guilds.some((g) => g.id === previouslySelected);
  const lostAccess = !!previouslySelected && !stillHasAccess;

  return (
    <SelectionShell>
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-fog">
            Select a server
          </h1>
          <p className="mt-1 text-sm text-ash">
            Showing servers where you have Manage Server permission.
          </p>
        </div>

        {lostAccess ? (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-crimson/30 bg-crimson/[0.08] px-4 py-3 text-sm text-crimson-bright">
            <span>
              You no longer have access to your previously selected server.
            </span>
            <form action={clearSelectedServer}>
              <button type="submit" className="underline hover:no-underline">
                Dismiss
              </button>
            </form>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-crimson/30 bg-crimson/[0.08] px-4 py-3 text-sm text-crimson-bright">
            {ERROR_COPY[error] ?? "Something went wrong. Try again."}
          </div>
        ) : null}

        {guilds.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No manageable servers found"
            description="We only show servers where your Discord account has the Manage Server permission. Ask a server admin to grant it, or pick a different Discord account."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {guilds.map((guild) => (
              <ServerCard
                key={guild.id}
                guild={guild}
                isSelected={stillHasAccess && guild.id === previouslySelected}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-ash">
          Picked a server? Head to its Overview page — your selection carries
          over automatically everywhere in the dashboard.
        </p>
      </div>
    </SelectionShell>
  );
}
