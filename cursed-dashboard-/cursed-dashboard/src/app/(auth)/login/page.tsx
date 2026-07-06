import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { CursedLogo } from "@/components/marketing/cursed-logo";
import { DiscordSignInButton } from "@/components/shared/discord-sign-in-button";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Couldn't start the Discord sign-in. Try again.",
  OAuthCallback: "Discord sign-in didn't complete. Try again.",
  AccessDenied: "You declined the Discord authorization request.",
  DiscordSessionExpired: "Your Discord session expired. Sign in again to continue.",
  Default: "Something went wrong signing you in. Try again.",
};

/**
 * SECURITY: `callbackUrl` comes from a query param, so it's attacker
 * controlled (e.g. a crafted `/login?callbackUrl=https://evil.example`
 * link). Only ever treat it as a same-origin relative path — never pass it
 * to `redirect()` unvalidated, or a signed-in visitor following such a
 * link gets bounced off-site right after "trusting" this domain, which is
 * a solid phishing setup. Rejects protocol-relative paths ("//evil.com")
 * too, since browsers treat those as absolute URLs.
 */
function safeRedirectPath(path: string | undefined, fallback: string): string {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const destination = safeRedirectPath(callbackUrl, "/dashboard");

  // Already signed in — no reason to show the login screen again. Skipped
  // when `error` is set: an app session can stay valid while the Discord
  // access token behind it has expired (see /dashboard's 401 handling), so
  // blindly redirecting back would bounce the user in an infinite loop
  // between here and the page that sent them here for that exact reason.
  if (session?.user && !error) {
    redirect(destination);
  }

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4">
      <div className="pointer-events-none absolute inset-0 bg-cursed-glow" />
      <div className="pointer-events-none absolute inset-0 bg-cursed-grid bg-grid opacity-40 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />

      <div className="glass relative w-full max-w-sm rounded-2xl p-8 text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
          <CursedLogo size={36} />
          <span className="font-display font-semibold tracking-wide text-fog">
            CURSED
          </span>
        </Link>

        <h1 className="font-display text-xl font-semibold text-fog">
          Sign in to your dashboard
        </h1>
        <p className="mt-2 text-sm text-ash">
          We only ask for your basic profile and server list — enough to show
          which servers you can manage.
        </p>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-crimson/30 bg-crimson/[0.08] px-3 py-2 text-sm text-crimson-bright"
          >
            {errorMessage}
          </p>
        ) : null}

        <DiscordSignInButton
          callbackUrl={destination}
          className="mt-6 w-full"
        />

        <p className="mt-6 text-xs text-ash">
          By continuing you agree this dashboard only reads your server list
          to check for Manage Server permission — it never joins, leaves, or
          modifies servers on your behalf.
        </p>
      </div>
    </main>
  );
}
