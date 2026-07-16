import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";

export async function unsupportedGuildFeature(
  request: NextRequest,
  guildId: string,
  feature: string
) {
  const access = await verifyGuildManageAccess(request, guildId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  return NextResponse.json(
    {
      error: `${feature} is not supported by the live bot yet.`,
      code: "FEATURE_NOT_SUPPORTED",
    },
    { status: 501 }
  );
}
