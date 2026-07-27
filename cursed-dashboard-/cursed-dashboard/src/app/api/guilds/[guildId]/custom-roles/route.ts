import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody } from "@/lib/api-route-helpers";
import type { CustomRoleDashboardData } from "@/types/custom-roles";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const data = await botApiRequest<CustomRoleDashboardData>(
      `guilds/${guildId}/custom-roles`,
      { headers: { "x-dashboard-user-id": access.userId } }
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load custom role settings.");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  if (!bodyResult.body || typeof bodyResult.body !== "object" || Array.isArray(bodyResult.body)) {
    return NextResponse.json(
      { error: "Expected a custom role configuration object.", code: "INVALID_BODY" },
      { status: 422 }
    );
  }

  try {
    const data = await botApiRequest<CustomRoleDashboardData>(
      `guilds/${guildId}/custom-roles`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(bodyResult.body),
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save custom role settings.");
  }
}
