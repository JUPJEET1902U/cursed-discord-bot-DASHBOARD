import { redirect } from "next/navigation";
import { CreditCard, Crown, Gauge, Server, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { auth } from "@/lib/auth";
import { botApiRequest } from "@/lib/bot-api";
import type { PremiumOwnerData, PremiumPlanLimits } from "@/types/premium";
import {
  grantPremium,
  grantServerPremium,
  revokePremium,
  revokeServerPremium,
  savePaymentSettings,
  setPremiumRole,
} from "./actions";

const fieldClass = "mt-1 w-full rounded-xl border border-white/[0.09] bg-black/25 px-3 py-2 text-sm text-fog outline-none transition focus:border-violet/50";
const cardClass = "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]";

function LimitCard({ title, plan }: { title: string; plan: PremiumPlanLimits }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-violet-bright" />
        <h3 className="font-display text-lg font-semibold text-fog">{title}</h3>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-ash">AI messages</dt><dd className="mt-1 font-medium text-fog">Unlimited</dd></div>
        <div><dt className="text-ash">Reply delay</dt><dd className="mt-1 font-medium text-fog">{plan.aiReplyCooldownMs ? `${plan.aiReplyCooldownMs / 1000}s` : "None"}</dd></div>
        <div><dt className="text-ash">Memory context</dt><dd className="mt-1 font-medium text-fog">{plan.memoryContextMessages} messages</dd></div>
        <div><dt className="text-ash">Images/user</dt><dd className="mt-1 font-medium text-fog">{plan.imageUserDaily}/day</dd></div>
        <div><dt className="text-ash">Memes/user</dt><dd className="mt-1 font-medium text-fog">{plan.memeUserDaily}/day</dd></div>
        <div><dt className="text-ash">Fun AI/user</dt><dd className="mt-1 font-medium text-fog">{plan.funUserDaily}/day</dd></div>
        <div><dt className="text-ash">Ticket panels</dt><dd className="mt-1 font-medium text-fog">{plan.ticketPanels}</dd></div>
        <div><dt className="text-ash">Tickets</dt><dd className="mt-1 font-medium text-fog">Unlimited</dd></div>
      </dl>
    </div>
  );
}

export default async function PremiumPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isOwner) redirect("/dashboard/overview");

  const data = await botApiRequest<PremiumOwnerData>("owner/premium", {
    headers: { "x-dashboard-user-id": session.user.id },
  });
  const settings = data.settings;

  return (
    <div>
      <PageHeader
        title="Premium & Billing"
        description="Owner-only user Premium, Server Premium, payment links, plan limits, and role synchronization."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <LimitCard title="CURSED Free" plan={data.plans.free} />
        <LimitCard title="CURSED Premium" plan={data.plans.premium} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-bright" />
            <h2 className="font-display text-xl font-semibold text-fog">Payment settings</h2>
          </div>
          <p className="mt-2 text-sm text-ash">These public links appear in the bot&apos;s Premium command. Webhook secrets remain Railway environment variables.</p>
          <form action={savePaymentSettings} className="mt-5 space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-sm text-fog">
              <input name="enabled" type="checkbox" defaultChecked={settings.enabled} className="h-4 w-4 accent-violet-500" />
              Show Premium payment options publicly
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ash">Currency<input name="currency" defaultValue={settings.currency} className={fieldClass} /></label>
              <label className="text-sm text-ash">Monthly price<input name="monthlyPrice" defaultValue={settings.monthlyPrice} className={fieldClass} /></label>
            </div>
            <label className="block text-sm text-ash">Headline<input name="headline" defaultValue={settings.headline} className={fieldClass} /></label>
            <label className="block text-sm text-ash">Customer instructions<textarea name="instructions" defaultValue={settings.instructions} rows={4} className={fieldClass} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ash">Checkout URL<input name="checkout" defaultValue={settings.links.checkout ?? ""} className={fieldClass} /></label>
              <label className="text-sm text-ash">Ko-fi URL<input name="kofi" defaultValue={settings.links.kofi ?? ""} className={fieldClass} /></label>
              <label className="text-sm text-ash">Patreon URL<input name="patreon" defaultValue={settings.links.patreon ?? ""} className={fieldClass} /></label>
              <label className="text-sm text-ash">Buy Me a Coffee URL<input name="bmc" defaultValue={settings.links.bmc ?? ""} className={fieldClass} /></label>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400">
              <ShieldCheck className="h-4 w-4" /> Save payment settings
            </button>
          </form>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-300" />
            <h2 className="font-display text-xl font-semibold text-fog">Grant user Premium</h2>
          </div>
          <p className="mt-2 text-sm text-ash">User Premium follows one Discord account across every CURSED server.</p>
          <form action={grantPremium} className="mt-5 space-y-4">
            <label className="block text-sm text-ash">Discord user ID<input name="userId" required pattern="[0-9]{17,20}" className={fieldClass} /></label>
            <label className="block text-sm text-ash">Duration in days <span className="text-ash/60">(blank = no expiry)</span><input name="days" type="number" min="1" max="3650" className={fieldClass} /></label>
            <label className="block text-sm text-ash">Internal note<textarea name="note" rows={3} className={fieldClass} /></label>
            <button className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300">
              <Sparkles className="h-4 w-4" /> Grant user Premium
            </button>
          </form>
        </section>
      </div>

      <section className={`${cardClass} mt-6`}>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-violet-bright" />
          <h2 className="font-display text-xl font-semibold text-fog">Server Premium</h2>
        </div>
        <p className="mt-2 text-sm text-ash">Direct server grants unlock server-wide Premium welcome, ticket, branding, and analytics controls. They do not change individual members&apos; personal AI or image limits.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.guilds.map((guild) => (
            <div key={guild.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-fog">{guild.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-ash/70">{guild.id}</div>
                </div>
                <span className={guild.effectivePremium
                  ? "rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200"
                  : "rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-ash"}>
                  {guild.effectivePremium ? "Premium" : "Free"}
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ash">
                {guild.premiumSource === "server"
                  ? `Direct server grant${guild.serverPremium?.expiresAt ? ` · expires ${guild.serverPremium.expiresAt.slice(0, 10)}` : " · no expiry"}`
                  : guild.premiumSource === "owner"
                    ? "Premium through the Discord server owner's user plan"
                    : "No server Premium entitlement"}
              </p>

              <form action={grantServerPremium} className="mt-4 space-y-3">
                <input type="hidden" name="guildId" value={guild.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-ash">Duration in days <span className="text-ash/60">(blank = no expiry)</span><input name="serverDays" type="number" min="1" max="3650" className={fieldClass} /></label>
                  <label className="text-xs text-ash">Internal note<input name="serverNote" defaultValue={guild.serverPremium?.note ?? ""} className={fieldClass} /></label>
                </div>
                <button className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400">
                  {guild.serverPremium ? "Renew direct Server Premium" : "Grant direct Server Premium"}
                </button>
              </form>

              {guild.serverPremium ? (
                <form action={revokeServerPremium} className="mt-2">
                  <input type="hidden" name="guildId" value={guild.id} />
                  <button className="rounded-lg border border-crimson/30 px-3 py-2 text-xs font-medium text-crimson-bright hover:bg-crimson/10">Revoke direct server grant</button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className={`${cardClass} mt-6`}>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-bright" />
          <h2 className="font-display text-xl font-semibold text-fog">Active Premium accounts ({data.accounts.length})</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/[0.08] text-ash"><tr><th className="px-3 py-3">Discord ID</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Granted</th><th className="px-3 py-3">Expires</th><th className="px-3 py-3">Action</th></tr></thead>
            <tbody>
              {data.accounts.map((account) => (
                <tr key={account.userId} className="border-b border-white/[0.05] text-fog">
                  <td className="px-3 py-3 font-mono text-xs">{account.userId}</td>
                  <td className="px-3 py-3">{account.source}</td>
                  <td className="px-3 py-3">{account.grantedAt.slice(0, 10)}</td>
                  <td className="px-3 py-3">{account.expiresAt?.slice(0, 10) ?? "No expiry"}</td>
                  <td className="px-3 py-3"><form action={revokePremium}><input type="hidden" name="userId" value={account.userId} /><button className="rounded-lg border border-crimson/30 px-3 py-1.5 text-xs text-crimson-bright hover:bg-crimson/10">Revoke</button></form></td>
                </tr>
              ))}
              {!data.accounts.length ? <tr><td colSpan={5} className="px-3 py-8 text-center text-ash">No paid accounts yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${cardClass} mt-6`}>
        <h2 className="font-display text-xl font-semibold text-fog">Premium badge roles</h2>
        <p className="mt-2 text-sm text-ash">Selecting a role does not grant Premium by itself. It is synchronized only after a user Premium grant or verified payment.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.guilds.map((guild) => (
            <form key={guild.id} action={setPremiumRole} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <input type="hidden" name="guildId" value={guild.id} />
              <div className="font-medium text-fog">{guild.name}</div>
              <select name="roleId" defaultValue={guild.premiumRoleId ?? ""} className={fieldClass}>
                <option value="">No synced Premium role</option>
                {guild.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              <button className="mt-3 rounded-lg border border-violet/35 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet/10">Save role</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
