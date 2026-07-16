import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { autoroleConfigSchema } from "@/lib/validation/autorole";
import type { BotAutoroleData } from "@/types/bot-api";

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
    const data = await botApiRequest<BotAutoroleData>(
      `guilds/${guildId}/autorole`
    );
    return NextResponse.json(data);
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load autorole settings.");
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

  let config;
  try {
    config = autoroleConfigSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<BotAutoroleData>(
      `guilds/${guildId}/autorole`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }
    );
    return NextResponse.json({ config: data.config });
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save autorole settings.");
  }
}
