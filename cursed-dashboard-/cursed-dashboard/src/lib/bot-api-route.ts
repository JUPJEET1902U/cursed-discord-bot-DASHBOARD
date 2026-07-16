import "server-only";
import { NextResponse } from "next/server";
import { BotApiError } from "@/lib/bot-api";

export function botApiErrorResponse(error: unknown, fallback: string) {
  if (!(error instanceof BotApiError)) {
    console.error("[bot-api] unexpected dashboard proxy failure", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: fallback, code: "BOT_API_PROXY_ERROR" },
      { status: 502 }
    );
  }

  const status = error.status === 401 ? 502 : error.status;
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
    { status }
  );
}
