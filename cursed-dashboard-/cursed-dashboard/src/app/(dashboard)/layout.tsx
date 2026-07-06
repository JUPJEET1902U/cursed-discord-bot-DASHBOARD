import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ToastProvider } from "@/hooks/use-toast";

/**
 * Auth guard for everything under /dashboard. `middleware.ts` already
 * blocks unauthenticated requests before they get here, but this checks
 * again server-side — defense in depth, so this still fails safe even if
 * the middleware matcher is ever narrowed by mistake.
 *
 * Deliberately renders no chrome of its own: the server-selection page
 * (`dashboard/page.tsx`) has its own minimal header, and every guild-scoped
 * page gets the full Sidebar + Navbar shell from
 * `(dashboard)/dashboard/(guild)/layout.tsx`. Putting a header here too
 * would stack both — this layout's only job is "you must be signed in."
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-void">{children}</div>
    </ToastProvider>
  );
}
