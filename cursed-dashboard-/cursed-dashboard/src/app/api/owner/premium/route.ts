import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import type { PremiumOwnerData, PremiumPaymentSettings } from "@/types/premium";

async function requireOwner() {
  const session = await auth();
  if (!session?.user) return { ok: false as const, status: 401, error: "Sign in with Discord." };
  if (!session.user.isOwner) return { ok: false as const, status: 403, error: "Only the CURSED bot owner can manage Premium." };
  return { ok: true as const, userId: session.user.id };
}

export async function GET() {
  const access = await requireOwner();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const data = await botApiRequest<PremiumOwnerData>("owner/premium", {
      headers: { "x-dashboard-user-id": access.userId },
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load Premium settings.");
  }
}

export async function PUT(request: NextRequest) {
  const access = await requireOwner();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const body = (await request.json()) as
      | { action: "settings"; settings: PremiumPaymentSettings }
      | { action: "role"; guildId: string; roleId: string | null };
    const path = body.action === "role"
      ? `owner/premium/guilds/${body.guildId}/role`
      : "owner/premium/settings";
    const payload = body.action === "role" ? { roleId: body.roleId } : body.settings;
    const data = await botApiRequest<PremiumOwnerData>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-dashboard-user-id": access.userId },
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save Premium settings.");
  }
}

export async function POST(request: NextRequest) {
  const access = await requireOwner();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const body = (await request.json()) as { userId: string; days?: number | null; note?: string };
    const data = await botApiRequest<PremiumOwnerData>("owner/premium/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-dashboard-user-id": access.userId },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't grant Premium.");
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireOwner();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const userId = request.nextUrl.searchParams.get("userId") ?? "";
  try {
    const data = await botApiRequest<PremiumOwnerData>(`owner/premium/accounts/${userId}`, {
      method: "DELETE",
      headers: { "x-dashboard-user-id": access.userId },
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't revoke Premium.");
  }
}
