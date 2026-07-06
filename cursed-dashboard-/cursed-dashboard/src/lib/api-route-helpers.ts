import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodError } from "zod";

/**
 * Every guild-config payload this app accepts (welcome embeds, autorole
 * lists, ...) is capped well under this by its own field-level `max()`
 * validators — 256 KB is a generous ceiling, not a real-world size. Its
 * only job is to stop an oversized/malicious body from being buffered into
 * memory and JSON-parsed in full before Zod ever gets a chance to reject
 * it (Next.js Route Handlers don't enforce a body-size limit on their own,
 * unlike the old Pages API's default 1 MB `bodyParser`).
 */
const MAX_BODY_BYTES = 256 * 1024;

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse };

/**
 * Reads and JSON-parses a request body for the guild config PUT routes,
 * rejecting bodies that are too large or aren't valid JSON. `Content-Length`
 * is checked first as a cheap early-out, but it can be missing or spoofed,
 * so the parsed body's serialized size is also checked after the fact.
 */
export async function readJsonBody(
  request: NextRequest
): Promise<JsonBodyResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      ),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }

  if (JSON.stringify(body).length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      ),
    };
  }

  return { ok: true, body };
}

/** Consistent 422 shape for a failed `schema.parse()` across every guild config route. */
export function zodErrorResponse(err: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Some fields need fixing before this can be saved.",
      fieldErrors: err.flatten().fieldErrors,
      formErrors: err.flatten().formErrors,
    },
    { status: 422 }
  );
}
