import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { welcomeConfigSchema } from "@/lib/validation/welcome";
import type { BotWelcomeData } from "@/types/bot-api";
import type { DiscordChannel } from "@/types/discord";
import type { WelcomeConfig } from "@/types/welcome";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

function toDiscordChannel(channel: BotWelcomeData["channels"][number]): DiscordChannel {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    parent_id: channel.parentId,
    position: channel.position,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const data = await botApiRequest<BotWelcomeData>(`guilds/${guildId}/welcome`);
    return NextResponse.json({
      config: data.config,
      channels: data.channels.map(toDiscordChannel),
    });
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load welcome settings.");
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

  let config: WelcomeConfig;
  try {
    config = welcomeConfigSchema.parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  try {
    const data = await botApiRequest<{ config: WelcomeConfig }>(
      `guilds/${guildId}/welcome`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }
    );
    return NextResponse.json({ config: data.config });
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save welcome settings.");
  }
}
