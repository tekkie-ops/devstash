import { Download } from "lucide-react";

import { CodeEditor } from "@/components/items/CodeEditor";
import { Section } from "@/components/items/ItemDetailSection";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/dashboard";
import type { ItemDetail } from "@/lib/db/items";
import { CODE_TYPES, MARKDOWN_TYPES } from "@/lib/item-types";
import { formatFileSize } from "@/lib/upload";

/** The item drawer's read-only (view mode) body. */
export function ItemDrawerBody({ detail }: { detail: ItemDetail }) {
  return (
    <div className="flex flex-col gap-6">
      {detail.description && (
        <Section title="Description">
          <p className="text-sm text-foreground">{detail.description}</p>
        </Section>
      )}

      <ContentSection detail={detail} />

      {detail.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {detail.collections.length > 0 && (
        <Section title="Collections">
          <div className="flex flex-wrap gap-1.5">
            {detail.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Details">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatLongDate(detail.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{formatLongDate(detail.updatedAt)}</dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}

function ContentSection({ detail }: { detail: ItemDetail }) {
  if (detail.contentType === "file") {
    return <FileSection detail={detail} />;
  }

  if (detail.url && !detail.content) {
    return (
      <Section title="URL">
        <a
          href={detail.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm break-all text-primary underline-offset-4 hover:underline"
        >
          {detail.url}
        </a>
      </Section>
    );
  }

  if (detail.content) {
    return (
      <Section title="Content">
        {CODE_TYPES.includes(detail.type.name) ? (
          <CodeEditor
            value={detail.content}
            language={detail.language}
            readOnly
          />
        ) : MARKDOWN_TYPES.includes(detail.type.name) ? (
          <MarkdownEditor value={detail.content} readOnly />
        ) : (
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
            {detail.content}
          </pre>
        )}
      </Section>
    );
  }

  return null;
}

/**
 * File / image items: an inline preview for images, a filename + size card
 * otherwise, and a Download button that goes through the same-origin proxy
 * route (`/api/items/[id]/download`) so it works without R2 CORS config.
 */
function FileSection({ detail }: { detail: ItemDetail }) {
  const isImage = detail.type.name === "image";
  const downloadHref = `/api/items/${detail.id}/download`;

  return (
    <Section title={isImage ? "Image" : "File"}>
      {isImage && detail.fileUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={detail.fileUrl}
          alt={detail.fileName ?? "Image preview"}
          className="max-h-72 w-full rounded-lg border object-contain"
        />
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {detail.fileName ?? "Unnamed file"}
          </span>
          {detail.fileSize != null && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(detail.fileSize)}
            </span>
          )}
        </div>
        {detail.fileUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={downloadHref} download>
              <Download className="size-4" />
              Download
            </a>
          </Button>
        )}
      </div>
    </Section>
  );
}
