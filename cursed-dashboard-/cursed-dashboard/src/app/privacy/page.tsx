import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — CURSED",
};

/**
 * Minimal placeholder — this route is linked from the marketing pages but
 * doesn't have real content yet. Exists so the link is a valid typedRoutes
 * destination instead of a dead link.
 */
export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold text-fog">Privacy Policy</h1>
      <p className="text-sm text-ash">Coming soon.</p>
      <Link href="/" className="text-sm text-violet-bright hover:underline">
        Back to home
      </Link>
    </main>
  );
}
