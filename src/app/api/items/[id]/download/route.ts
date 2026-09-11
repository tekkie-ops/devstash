import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import { getR2Object, r2KeyFromUrl } from "@/lib/r2";

/**
 * Streams a `file` / `image` item's R2 object back to the browser as an
 * attachment. Proxying (rather than linking straight to `R2_PUBLIC_URL`) keeps
 * the download same-origin — no R2 CORS config — and lets us force a download
 * with the original filename. Auth-gated + owner-scoped via `getItemDetail`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const item = await getItemDetail(session.user.id, id);

  if (!item || item.contentType !== "file" || !item.fileUrl) {
    return Response.json(
      { success: false, error: "File not found" },
      { status: 404 },
    );
  }

  const key = r2KeyFromUrl(item.fileUrl);
  if (!key) {
    return Response.json(
      { success: false, error: "File not found" },
      { status: 404 },
    );
  }

  try {
    const object = await getR2Object(key);
    if (!object.Body) {
      throw new Error("R2 object has no body");
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.ContentType ?? "application/octet-stream",
    );
    if (object.ContentLength != null) {
      headers.set("Content-Length", String(object.ContentLength));
    }
    headers.set(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(item.fileName ?? "download")}"`,
    );

    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    console.error(`R2 download failed for item ${id}:`, error);
    return Response.json(
      { success: false, error: "Download failed" },
      { status: 502 },
    );
  }
}

/** Replaces quotes, backslashes and control chars so the value is header-safe. */
function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\u0000-\u001f"\\]/g, "_").trim();
  return cleaned || "download";
}
