import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { securityActionSchema } from "@/lib/validation/security";
import type { SecurityActionRequest, SecurityData } from "@/types/security";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let action: SecurityActionRequest;
  try {
    action = securityActionSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<{ result: unknown; data: SecurityData }>(
      `guilds/${guildId}/security/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(action),
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Server Protection action failed safely.");
  }
}
