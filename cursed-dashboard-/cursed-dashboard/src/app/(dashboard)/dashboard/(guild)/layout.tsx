import { requireSelectedGuild } from "@/lib/guild";
import { GuildProvider } from "@/components/dashboard/guild-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";

/**
 * Wraps every guild-scoped page (Overview, Welcome, Moderation, ...). This
 * route group (`(guild)`) doesn't affect the URL — `/dashboard/overview`
 * still resolves the same way — it just lets this layout apply only to
 * these pages and not to `/dashboard` itself (the server-selection page,
 * which intentionally has no sidebar since there's no guild context yet).
 *
 * `requireSelectedGuild()` is the actual security boundary here: it reads
 * the guild cookie, re-verifies it against a fresh Discord fetch, and
 * redirects to `/dashboard` if there's no guild selected or the user no
 * longer manages it. Every page under this layout can assume `useGuild()`
 * returns a guild the current user is verified to manage right now — not
 * "was manageable whenever the cookie was set."
 */
export default async function GuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guild = await requireSelectedGuild();

  return (
    <GuildProvider guild={guild}>
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </GuildProvider>
  );
}
