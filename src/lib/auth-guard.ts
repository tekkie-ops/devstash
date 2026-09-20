import { NextResponse } from "next/server";

import { auth } from "@/auth";

type RequireUserIdResult =
  | { userId: string; response?: undefined }
  | { userId?: undefined; response: NextResponse };

/**
 * Auth-gates an API route — proxy.ts only covers page routes, not /api/*.
 * Returns the resolved userId, or a ready-to-return 401 NextResponse:
 *
 *   const auth = await requireUserId();
 *   if (auth.response) return auth.response;
 *   // use auth.userId
 */
export async function requireUserId(): Promise<RequireUserIdResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { userId: session.user.id };
}
