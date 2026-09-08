"use client";

import { useEffect, useId, useRef, useState } from "react";
import { File as FileIcon, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  acceptAttr,
  formatFileSize,
  UPLOAD_CONSTRAINTS,
  validateUploadFile,
  type UploadKind,
} from "@/lib/upload";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  /** Lets the parent disable its submit button while a transfer is running. */
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Drag-and-drop / click upload for `file` and `image` items. Sends the file to
 * `POST /api/upload` over `XMLHttpRequest` (for real progress events), then
 * hands the returned `{ fileUrl, fileName, fileSize }` up via `onChange`. The
 * New Item dialog passes that straight to the `createItem` action.
 */
export function FileUpload({
  kind,
  value,
  onChange,
  onUploadingChange,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxLabel = formatFileSize(UPLOAD_CONSTRAINTS[kind].maxBytes);
  const extLabel = UPLOAD_CONSTRAINTS[kind].extensions.join(", ");

  useEffect(() => {
    return () => xhrRef.current?.abort();
  }, []);

  function finishUploading(nextError: string | null) {
    setUploading(false);
    setProgress(0);
    onUploadingChange?.(false);
    xhrRef.current = null;
    if (nextError) setError(nextError);
  }

  function startUpload(file: File) {
    const check = validateUploadFile(kind, {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setError(null);
    setProgress(0);
    setUploading(true);
    onUploadingChange?.(true);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/upload");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let body: { success?: boolean; data?: UploadedFile; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic error below
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
        finishUploading(null);
        onChange(body.data);
      } else {
        finishUploading(body.error ?? "Upload failed. Please try again.");
      }
    });

    xhr.addEventListener("error", () =>
      finishUploading("Upload failed. Please try again."),
    );
    xhr.addEventListener("abort", () => finishUploading(null));

    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    xhr.send(form);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) startUpload(file);
  }

  function handleRemove() {
    xhrRef.current?.abort();
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.fileUrl}
              alt={value.fileName}
              className="size-14 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted/40">
              <FileIcon className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {value.fileName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove file"
            onClick={handleRemove}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!uploading) handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <span className="text-sm">
          <span className="font-medium text-foreground">Click to upload</span> or
          drag and drop
        </span>
        <span className="text-xs text-muted-foreground">
          {extLabel} · up to {maxLabel}
        </span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={acceptAttr(kind)}
          className="sr-only"
          disabled={uploading}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>

      {uploading && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {progress}%
          </span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
