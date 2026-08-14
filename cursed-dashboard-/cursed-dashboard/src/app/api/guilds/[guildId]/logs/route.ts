import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody } from "@/lib/api-route-helpers";
import { logsConfigSchema } from "@/lib/validation/logs";
import type { LogsDashboardData } from "@/types/logs";

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
    const data = await botApiRequest<LogsDashboardData>(`guilds/${guildId}/logs`, {
      headers: { "x-dashboard-user-id": access.userId },
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load logging settings.");
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

  const parsed = logsConfigSchema.safeParse(bodyResult.body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Logging settings are not valid.",
        code: "VALIDATION_ERROR",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  try {
    const data = await botApiRequest<LogsDashboardData>(`guilds/${guildId}/logs`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-user-id": access.userId,
      },
      body: JSON.stringify(parsed.data),
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save logging settings.");
  }
}
