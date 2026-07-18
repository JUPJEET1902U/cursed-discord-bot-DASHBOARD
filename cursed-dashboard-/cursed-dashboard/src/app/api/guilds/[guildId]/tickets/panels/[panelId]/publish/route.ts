import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";

interface RouteParams {
  params: Promise<{ guildId: string; panelId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { guildId, panelId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const body = await request.json();
    const data = await botApiRequest(
      `guilds/${guildId}/tickets/panels/${panelId}/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't publish the ticket panel.");
  }
}
