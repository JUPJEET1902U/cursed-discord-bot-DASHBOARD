import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { moderationCaseOperationSchema } from "@/lib/validation/moderation";
import type { ModerationCase, ModerationCaseOperation, ModerationStats } from "@/types/moderation";

interface RouteParams {
  params: Promise<{ guildId: string; caseNumber: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { guildId, caseNumber } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!/^\d+$/.test(caseNumber) || Number(caseNumber) < 1) {
    return NextResponse.json({ error: "Invalid case number." }, { status: 400 });
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let operation: ModerationCaseOperation;
  try {
    operation = moderationCaseOperationSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<{ case: ModerationCase; stats: ModerationStats }>(
      `guilds/${guildId}/moderation/cases/${caseNumber}`,
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
    return botApiErrorResponse(error, "Couldn't update the moderation case.");
  }
}
