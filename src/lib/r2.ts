import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 access for file/image item uploads. R2 speaks the S3 API, so we
 * use `@aws-sdk/client-s3` pointed at the account's R2 endpoint. Objects are
 * written server-side (the browser never talks to R2 directly) and served to
 * viewers either from `R2_PUBLIC_URL` (image previews) or through the download
 * proxy route (attachments).
 */

/** Empty when uploads are not configured — callers should 503 in that case. */
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";

const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

let client: S3Client | null = null;

function r2Client(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID ?? "";
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

/** Public URL for a stored object key, e.g. `${R2_PUBLIC_URL}/items/image/abc.png`. */
export function r2PublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Recovers the object key from a URL produced by `r2PublicUrl`. Returns null
 * when the URL isn't under the configured public base (e.g. legacy/mismatched
 * data), so callers can skip R2 cleanup rather than delete the wrong thing.
 */
export function r2KeyFromUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(`${PUBLIC_URL}/`)) {
    return null;
  }
  return url.slice(PUBLIC_URL.length + 1);
}

export async function putR2Object(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getR2Object(key: string) {
  return r2Client().send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
}

export async function deleteR2Object(key: string): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
}
