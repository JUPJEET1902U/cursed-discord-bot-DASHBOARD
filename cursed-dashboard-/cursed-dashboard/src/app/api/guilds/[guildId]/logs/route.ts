import type { NextRequest } from "next/server";
import { unsupportedGuildFeature } from "@/lib/unsupported-feature-route";

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

async function unavailable(request: NextRequest, { params }: RouteParams) {
  const { guildId } = await params;
  return unsupportedGuildFeature(request, guildId, "Stored logs");
}

export const GET = unavailable;
export const PUT = unavailable;
