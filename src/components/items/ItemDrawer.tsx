"use client";

import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate } from "@/lib/dashboard";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ItemDetail | null;
  loading: boolean;
  error: string | null;
}

export function ItemDrawer({
  open,
  onOpenChange,
  detail,
  loading,
  error,
}: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="gap-3 border-b p-6 pr-14">
          {loading || !detail ? (
            <LoadingHeader error={error} />
          ) : (
            <>
              <div className="flex items-start gap-3">
                <ItemTypeTile type={detail.type} />
                <SheetTitle className="text-lg leading-tight">
                  {detail.title}
                </SheetTitle>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{detail.type.label}</Badge>
                {detail.language && (
                  <Badge variant="secondary">{detail.language}</Badge>
                )}
              </div>

              <ActionBar detail={detail} />
            </>
          )}
          <SheetDescription className="sr-only">
            {detail?.description ?? "Item details"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || !detail ? (
            <LoadingBody />
          ) : (
            <ItemDrawerBody detail={detail} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The favorite/pin/copy/edit/delete row. Favorite reflects the item's state
 * (amber when active); the mutations themselves land in a later feature — only
 * Copy is wired up for now.
 */
function ActionBar({ detail }: { detail: ItemDetail }) {
  function handleCopy() {
    const text = detail.content ?? detail.url ?? "";
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm">
        <Star
          className={cn(
            "size-4",
            detail.isFavorite && "fill-amber-400 text-amber-400",
          )}
        />
        Favorite
      </Button>
      <Button type="button" variant="ghost" size="sm">
        <Pin
          className={cn("size-4", detail.isPinned && "text-foreground")}
        />
        Pin
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
        <Copy className="size-4" />
        Copy
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function ItemDrawerBody({ detail }: { detail: ItemDetail }) {
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
    return (
      <Section title="File">
        <p className="text-sm text-foreground">
          {detail.fileName ?? "Unnamed file"}
          {detail.fileSize != null && (
            <span className="text-muted-foreground">
              {" "}
              · {detail.fileSize.toLocaleString()} bytes
            </span>
          )}
        </p>
      </Section>
    );
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
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
          {detail.content}
        </pre>
      </Section>
    );
  }

  return null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function LoadingHeader({ error }: { error: string | null }) {
  if (error) {
    return (
      <>
        <SheetTitle className="text-lg leading-tight">
          Couldn&apos;t load item
        </SheetTitle>
        <p className="text-sm text-destructive">{error}</p>
      </>
    );
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-7 w-full" />
      <SheetTitle className="sr-only">Loading item</SheetTitle>
    </>
  );
}

function LoadingBody() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
