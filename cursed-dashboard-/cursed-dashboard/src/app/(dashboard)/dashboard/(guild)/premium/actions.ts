"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { botApiRequest } from "@/lib/bot-api";
import type { PremiumOwnerData } from "@/types/premium";

async function ownerId(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isOwner) redirect("/dashboard/overview");
  return session.user.id;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function savePaymentSettings(formData: FormData) {
  const userId = await ownerId();
  await botApiRequest<PremiumOwnerData>("owner/premium/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-dashboard-user-id": userId },
    body: JSON.stringify({
      enabled: formData.get("enabled") === "on",
      currency: text(formData, "currency"),
      monthlyPrice: text(formData, "monthlyPrice"),
      headline: text(formData, "headline"),
      instructions: text(formData, "instructions"),
      links: {
        checkout: text(formData, "checkout") || null,
        kofi: text(formData, "kofi") || null,
        patreon: text(formData, "patreon") || null,
        bmc: text(formData, "bmc") || null,
      },
    }),
  });
  revalidatePath("/dashboard/premium");
}

export async function grantPremium(formData: FormData) {
  const userId = await ownerId();
  const rawDays = text(formData, "days");
  await botApiRequest<PremiumOwnerData>("owner/premium/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-dashboard-user-id": userId },
    body: JSON.stringify({
      userId: text(formData, "userId"),
      days: rawDays ? Number(rawDays) : null,
      note: text(formData, "note"),
    }),
  });
  revalidatePath("/dashboard/premium");
}

export async function revokePremium(formData: FormData) {
  const owner = await ownerId();
  const accountId = text(formData, "userId");
  await botApiRequest<PremiumOwnerData>(`owner/premium/accounts/${accountId}`, {
    method: "DELETE",
    headers: { "x-dashboard-user-id": owner },
  });
  revalidatePath("/dashboard/premium");
}

export async function grantServerPremium(formData: FormData) {
  const owner = await ownerId();
  const rawDays = text(formData, "serverDays");
  await botApiRequest<PremiumOwnerData>("owner/premium/guilds", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-dashboard-user-id": owner },
    body: JSON.stringify({
      guildId: text(formData, "guildId"),
      days: rawDays ? Number(rawDays) : null,
      note: text(formData, "serverNote"),
    }),
  });
  revalidatePath("/dashboard/premium");
}

export async function revokeServerPremium(formData: FormData) {
  const owner = await ownerId();
  const guildId = text(formData, "guildId");
  await botApiRequest<PremiumOwnerData>(`owner/premium/guilds/${guildId}`, {
    method: "DELETE",
    headers: { "x-dashboard-user-id": owner },
  });
  revalidatePath("/dashboard/premium");
}

export async function setPremiumRole(formData: FormData) {
  const owner = await ownerId();
  const guildId = text(formData, "guildId");
  await botApiRequest<PremiumOwnerData>(`owner/premium/guilds/${guildId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-dashboard-user-id": owner },
    body: JSON.stringify({ roleId: text(formData, "roleId") || null }),
  });
  revalidatePath("/dashboard/premium");
}
