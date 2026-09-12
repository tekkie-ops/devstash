import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createCollection } from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collections";

/**
 * Creates a collection owned by the signed-in user, from the New Collection
 * dialog. Auth-gated (the page routes are covered by proxy.ts, but /api/* is
 * not); the schema is the source of truth for validation.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 },
    );
  }

  try {
    const collection = await createCollection(session.user.id, parsed.data);
    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error("createCollection failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
