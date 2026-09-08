/**
 * Shared upload rules for `file` / `image` items. Used by the client
 * (`FileUpload` — pre-flight check + `accept` attr) and by the upload API route
 * (authoritative check before anything reaches R2). Pure/deterministic apart
 * from `buildObjectKey`, which mints a random key.
 */

export const UPLOAD_KINDS = ["file", "image"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export interface UploadConstraint {
  /** Inclusive maximum size in bytes. */
  maxBytes: number;
  /** Allowed lowercase extensions, including the leading dot. */
  extensions: string[];
  /** Allowed MIME types. Empty / octet-stream types fall back to the extension. */
  mimeTypes: string[];
}

const MB = 1024 * 1024;

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  image: {
    maxBytes: 5 * MB,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    maxBytes: 10 * MB,
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

/** Browsers often omit or genericise the MIME type for text-ish files. */
const LENIENT_MIME_TYPES = new Set(["", "application/octet-stream"]);

export interface UploadFileMeta {
  name: string;
  size: number;
  type: string;
}

/** Lowercased extension including the dot, or "" when the name has none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot).toLowerCase();
}

/** Compact human size: "812 B", "44 KB", "3.7 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export type UploadValidation = { ok: true } | { ok: false; error: string };

export function validateUploadFile(
  kind: UploadKind,
  file: UploadFileMeta,
): UploadValidation {
  const constraint = UPLOAD_CONSTRAINTS[kind];
  const noun = kind === "image" ? "Images" : "Files";
  const ext = fileExtension(file.name);

  if (!ext || !constraint.extensions.includes(ext)) {
    return {
      ok: false,
      error: `${noun} must be one of: ${constraint.extensions.join(", ")}`,
    };
  }

  if (
    !LENIENT_MIME_TYPES.has(file.type) &&
    !constraint.mimeTypes.includes(file.type)
  ) {
    return { ok: false, error: `Unsupported file type: ${file.type}` };
  }

  if (file.size <= 0) {
    return { ok: false, error: "File is empty" };
  }

  if (file.size > constraint.maxBytes) {
    return {
      ok: false,
      error: `${noun} must be ${formatFileSize(constraint.maxBytes)} or smaller`,
    };
  }

  return { ok: true };
}

/** `accept` attribute value for a file input of the given kind. */
export function acceptAttr(kind: UploadKind): string {
  return UPLOAD_CONSTRAINTS[kind].extensions.join(",");
}

/** Random object key under `items/<kind>/`, preserving the original extension. */
export function buildObjectKey(kind: UploadKind, fileName: string): string {
  return `items/${kind}/${crypto.randomUUID()}${fileExtension(fileName)}`;
}
