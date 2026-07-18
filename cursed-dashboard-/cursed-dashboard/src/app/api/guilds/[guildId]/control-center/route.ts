import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import { readJsonBody, zodErrorResponse } from "@/lib/api-route-helpers";
import { controlCenterSaveSchema } from "@/lib/validation/control-center";
import type {
  ControlCenterConfig,
  ControlCenterData,
  ControlCenterSavePayload,
} from "@/types/control-center";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

const REMOVED_MODULE_KEYS = new Set(["summary", "knowledge"]);
const REMOVED_COMMAND_NAMES = new Set([
  "/summary",
  "/knowledge",
  "!summary",
  "!knowledge",
]);

function removeRetiredConfig(config: ControlCenterConfig): ControlCenterConfig {
  return {
    ...config,
    disabledModules: config.disabledModules.filter(
      (key) => !REMOVED_MODULE_KEYS.has(key)
    ),
    disabledCommands: config.disabledCommands.filter(
      (name) => !REMOVED_COMMAND_NAMES.has(name.toLowerCase())
    ),
  };
}

function removeRetiredFeatures(data: ControlCenterData): ControlCenterData {
  return {
    ...data,
    config: removeRetiredConfig(data.config),
    modules: data.modules.filter((module) => !REMOVED_MODULE_KEYS.has(module.key)),
    commands: data.commands.filter(
      (command) => !REMOVED_COMMAND_NAMES.has(command.name.toLowerCase())
    ),
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const data = await botApiRequest<ControlCenterData>(
      `guilds/${guildId}/control-center`
    );
    return NextResponse.json(removeRetiredFeatures(data));
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't load control center settings.");
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

  let payload: ControlCenterSavePayload;
  try {
    payload = controlCenterSaveSchema.strict().parse(bodyResult.body);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    throw error;
  }

  const cleanPayload: ControlCenterSavePayload = {
    ...payload,
    config: removeRetiredConfig(payload.config),
  };

  try {
    const data = await botApiRequest<
      Pick<ControlCenterData, "config" | "leveling" | "levelingStats">
    >(`guilds/${guildId}/control-center`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload),
    });
    return NextResponse.json({
      ...data,
      config: removeRetiredConfig(data.config),
    });
  } catch (error) {
    return botApiErrorResponse(error, "Couldn't save control center settings.");
  }
}
