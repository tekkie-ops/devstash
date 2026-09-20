import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type ParseJsonBodyResult<T> =
  | { data: T; response?: undefined }
  | { data?: undefined; response: NextResponse };

/**
 * Parses a request's JSON body defensively and validates it against `schema`,
 * returning the first Zod issue message on failure:
 *
 *   const parsed = await parseJsonBody(request, mySchema);
 *   if (parsed.response) return parsed.response;
 *   // use parsed.data
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParseJsonBodyResult<T>> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}

/** `404 { success: false, error: "<Entity> not found" }`. */
export function notFoundResponse(entity: string): NextResponse {
  return NextResponse.json(
    { success: false, error: `${entity} not found` },
    { status: 404 },
  );
}

/** Logs the failure server-side and returns a generic `500`. */
export function internalErrorResponse(
  context: string,
  error: unknown,
): NextResponse {
  console.error(`${context} failed:`, error);
  return NextResponse.json(
    { success: false, error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
