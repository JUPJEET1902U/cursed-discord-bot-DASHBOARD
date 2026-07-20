import { requireSelectedGuild } from "@/lib/guild";
import { GuildProvider } from "@/components/dashboard/guild-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { DashboardAmbient } from "@/components/dashboard/dashboard-ambient";

/** Guild-scoped dashboard shell. Data boundaries and route behavior are unchanged. */
export default async function GuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guild = await requireSelectedGuild();

  return (
    <GuildProvider guild={guild}>
      <div className="relative min-h-screen overflow-x-clip">
        <DashboardAmbient />
        <Sidebar />
        <div className="relative z-10 lg:pl-72">
          <Navbar />
          <main className="mx-auto max-w-[1480px] px-4 pb-14 pt-6 sm:px-6 lg:px-10 lg:pb-20 lg:pt-8">
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </GuildProvider>
  );
}
