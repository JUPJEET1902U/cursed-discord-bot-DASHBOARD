import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { securitySuiteActionSchema, securitySuiteConfigSchema } from "@/lib/validation/security-suite";
import type {
  SecuritySuiteActionRequest,
  SecuritySuiteActionResult,
  SecuritySuiteConfig,
  SecuritySuiteData,
} from "@/types/security-suite";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const data = await botApiRequest<SecuritySuiteData>(`guilds/${guildId}/security-suite`, {
      headers: { "x-dashboard-user-id": access.userId },
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Could not load the Security Recovery Suite.");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let config: SecuritySuiteConfig;
  try {
    config = securitySuiteConfigSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<SecuritySuiteData>(`guilds/${guildId}/security-suite`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-user-id": access.userId,
      },
      body: JSON.stringify(config),
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Could not save recovery-suite settings.");
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;

  let action: SecuritySuiteActionRequest;
  try {
    action = securitySuiteActionSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<SecuritySuiteActionResult>(`guilds/${guildId}/security-suite/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-user-id": access.userId,
      },
      body: JSON.stringify(action),
    });
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Security Recovery Suite action failed safely.");
  }
}