import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { putR2Object, r2PublicUrl, R2_BUCKET } from "@/lib/r2";
import {
  buildObjectKey,
  UPLOAD_KINDS,
  validateUploadFile,
  type UploadKind,
} from "@/lib/upload";

/**
 * Stores one `file` / `image` upload in R2 and returns its metadata. The New
 * Item dialog calls this first, then passes the returned `{ fileUrl, fileName,
 * fileSize }` to the `createItem` action — so an object can be orphaned in R2 if
 * the dialog is cancelled before the item is saved.
 *
 * Auth-gated here (proxy.ts only covers page routes). `validateUploadFile` is
 * the authoritative size/extension/MIME check; the client mirrors it only to
 * fail fast.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!R2_BUCKET) {
    return NextResponse.json(
      { success: false, error: "File uploads are not configured" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const kind = form.get("kind");
  const file = form.get("file");

  if (
    typeof kind !== "string" ||
    !(UPLOAD_KINDS as readonly string[]).includes(kind)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid upload kind" },
      { status: 400 },
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 },
    );
  }

  const check = validateUploadFile(kind as UploadKind, {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!check.ok) {
    return NextResponse.json(
      { success: false, error: check.error },
      { status: 400 },
    );
  }

  const key = buildObjectKey(kind as UploadKind, file.name);
  const contentType = file.type || "application/octet-stream";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await putR2Object(key, buffer, contentType);
  } catch (error) {
    console.error("R2 upload failed:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      fileUrl: r2PublicUrl(key),
      fileName: file.name,
      fileSize: file.size,
    },
  });
}
