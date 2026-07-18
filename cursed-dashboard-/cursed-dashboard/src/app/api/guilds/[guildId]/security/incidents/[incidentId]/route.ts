import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { securityIncidentOperationSchema } from "@/lib/validation/security";
import type { SecurityIncident, SecurityIncidentOperation, SecurityIncidentStats } from "@/types/security";

interface RouteParams {
  params: Promise<{ guildId: string; incidentId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { guildId, incidentId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let operation: SecurityIncidentOperation;
  try {
    operation = securityIncidentOperationSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<{ incident: SecurityIncident; stats: SecurityIncidentStats }>(
      `guilds/${guildId}/security/incidents/${incidentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-user-id": access.userId,
        },
        body: JSON.stringify(operation),
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Could not update the security incident.");
  }
}
