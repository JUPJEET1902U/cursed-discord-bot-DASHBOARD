import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { coreSecurityData } from "@/lib/security-core-data";
import { securityConfigSchema } from "@/lib/validation/security";
import type { SecurityConfig, SecurityData } from "@/types/security";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const data = await botApiRequest<SecurityData>(`guilds/${guildId}/security`);
    return NextResponse.json(coreSecurityData(data));
  } catch (error) {
    return botApiErrorResponse(error, "Could not load Server Protection settings.");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let config: SecurityConfig;
  try {
    config = securityConfigSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<SecurityData>(`guilds/${guildId}/security`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-user-id": access.userId,
      },
      body: JSON.stringify(config),
    });
    return NextResponse.json(coreSecurityData(data));
  } catch (error) {
    return botApiErrorResponse(error, "Could not save Server Protection settings.");
  }
}