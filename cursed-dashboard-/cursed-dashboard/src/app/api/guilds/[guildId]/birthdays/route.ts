import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import type { BirthdaysData, BirthdaySettingsInput } from "@/types/birthdays";

interface Params {
  params: Promise<{ guildId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    return NextResponse.json(
      await botApiRequest<BirthdaysData>(`guilds/${guildId}/birthdays`, {
        headers: { "x-dashboard-user-id": access.userId },
      })
    );
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load birthday settings.");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const body = (await request.json()) as BirthdaySettingsInput;
    return NextResponse.json(
      await botApiRequest<BirthdaysData>(`guilds/${guildId}/birthdays/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(body),
      })
    );
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save birthday settings.");
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const body = (await request.json()) as { userId: string; date: string };
    return NextResponse.json(
      await botApiRequest<BirthdaysData>(`guilds/${guildId}/birthdays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(body),
      })
    );
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save that birthday.");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const userId = request.nextUrl.searchParams.get("userId") ?? "";
  try {
    return NextResponse.json(
      await botApiRequest<BirthdaysData>(`guilds/${guildId}/birthdays/${userId}`, {
        method: "DELETE",
        headers: { "x-dashboard-user-id": access.userId },
      })
    );
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't remove that birthday.");
  }
}
