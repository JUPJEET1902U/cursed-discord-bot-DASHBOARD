import Link from "next/link";
import { CursedLogo } from "./cursed-logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Dashboard", href: "/login" },
      { label: "Premium", href: "/premium" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Command list", href: "/docs/commands" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Support server", href: "/support" },
      { label: "Twitter / X", href: "https://x.com" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] py-16 px-4">
      <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <CursedLogo size={28} animated={false} />
            <span className="font-display font-semibold text-fog">CURSED</span>
          </Link>
          <p className="mt-4 text-sm text-ash max-w-xs">
            Moderation and AI for Discord servers that take their community seriously.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-medium text-fog mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ash hover:text-fog transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/[0.06] text-xs text-ash flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} CURSED. Not affiliated with Discord Inc.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-fog transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-fog transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
