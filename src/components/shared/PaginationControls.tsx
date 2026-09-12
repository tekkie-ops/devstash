import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PageToken = number | "ellipsis";

/** Page numbers to render: first, last, current, and current's immediate neighbors, with gaps collapsed to an ellipsis. */
function getPageTokens(current: number, total: number): PageToken[] {
  const show = new Set(
    [1, total, current, current - 1, current + 1].filter(
      (page) => page >= 1 && page <= total,
    ),
  );
  const pages = [...show].sort((a, b) => a - b);

  const tokens: PageToken[] = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) {
      tokens.push("ellipsis");
    }
    tokens.push(page);
    previous = page;
  }

  return tokens;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  /** The page's own path, with no query string (e.g. "/items/snippets"). */
  basePath: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  basePath,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {hasPrev ? (
        <Button asChild variant="outline" size="icon-sm">
          <Link href={pageHref(basePath, currentPage - 1)} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
      )}

      {getPageTokens(currentPage, totalPages).map((token, index) =>
        token === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={token}
            asChild
            variant={token === currentPage ? "default" : "outline"}
            size="icon-sm"
            aria-current={token === currentPage ? "page" : undefined}
          >
            <Link href={pageHref(basePath, token)}>{token}</Link>
          </Button>
        ),
      )}

      {hasNext ? (
        <Button asChild variant="outline" size="icon-sm">
          <Link href={pageHref(basePath, currentPage + 1)} aria-label="Next page">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
