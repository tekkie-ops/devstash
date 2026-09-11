"use client";

import type { KeyboardEvent, ReactNode } from "react";
import {
  Download,
  File,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
} from "lucide-react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { Button } from "@/components/ui/button";
import { formatItemDate } from "@/lib/dashboard";
import type { ItemSummary } from "@/lib/db/items";
import { formatFileSize } from "@/lib/upload";

const ICON_CLASS = "size-4.5";

/** Extensions match UPLOAD_CONSTRAINTS in src/lib/upload.ts. */
const EXTENSION_ICONS: Record<string, ReactNode> = {
  pdf: <FileText className={ICON_CLASS} />,
  txt: <FileText className={ICON_CLASS} />,
  md: <FileText className={ICON_CLASS} />,
  json: <FileJson className={ICON_CLASS} />,
  xml: <FileCode className={ICON_CLASS} />,
  yaml: <FileCode className={ICON_CLASS} />,
  yml: <FileCode className={ICON_CLASS} />,
  toml: <FileCode className={ICON_CLASS} />,
  ini: <FileCode className={ICON_CLASS} />,
  csv: <FileSpreadsheet className={ICON_CLASS} />,
};

const FALLBACK_ICON = <File className={ICON_CLASS} />;

/**
 * Single-column list row for `file`-type items — Drive/Dropbox style, used on
 * /items/files instead of the ItemCard grid. Clicking the row opens the item
 * drawer; the download button downloads directly without opening it. A client
 * component (not ItemDrawerTrigger) because the download anchor can't nest
 * inside the trigger's <button>.
 */
export function FileListRow({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();
  const ext = item.fileName?.split(".").pop()?.toLowerCase();
  const icon = (ext && EXTENSION_ICONS[ext]) || FALLBACK_ICON;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem(item.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={() => openItem(item.id)}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium">
            {item.fileName ?? item.title}
          </span>
          {item.isPinned && (
            <Pin
              aria-label="Pinned"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          {item.isFavorite && (
            <Star
              aria-label="Favorite"
              className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
            />
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground sm:shrink-0">
          <span className="sm:w-16 sm:text-right">
            {item.fileSize !== null ? formatFileSize(item.fileSize) : "—"}
          </span>
          <time
            dateTime={item.createdAt.toISOString()}
            className="sm:w-16 sm:text-right"
          >
            {formatItemDate(item.createdAt)}
          </time>
        </div>
      </div>

      <Button
        asChild
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <a
          href={`/api/items/${item.id}/download`}
          download
          aria-label={`Download ${item.fileName ?? item.title}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Download />
        </a>
      </Button>
    </div>
  );
}
