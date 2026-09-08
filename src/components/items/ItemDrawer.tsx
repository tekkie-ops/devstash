"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteItem, updateItem } from "@/actions/items";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate } from "@/lib/dashboard";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";

/** Type names whose items carry an editable free-text body. */
const CONTENT_TYPES = ["snippet", "prompt", "command", "note"];
/** Type names whose items carry an editable language tag. */
const LANGUAGE_TYPES = ["snippet", "command"];
/** Type names whose body is code — shown in a Monaco editor, not a textarea. */
const CODE_TYPES = ["snippet", "command"];
/** Type names whose body is prose — shown in a Markdown editor with Write/Preview. */
const MARKDOWN_TYPES = ["note", "prompt"];

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ItemDetail | null;
  loading: boolean;
  error: string | null;
  /** Called with the refreshed detail after a successful save. */
  onSaved: (detail: ItemDetail) => void;
  /** Called after a successful delete — closes the drawer and clears detail. */
  onDeleted: () => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  detail,
  loading,
  error,
  onSaved,
  onDeleted,
}: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 sm:max-w-xl">
        {loading || !detail ? (
          <>
            <SheetHeader className="gap-3 border-b p-6 pr-14">
              <LoadingHeader error={error} />
              <SheetDescription className="sr-only">
                Item details
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <LoadingBody />
            </div>
          </>
        ) : (
          <ItemDrawerContent
            key={detail.id}
            detail={detail}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The detail-present view. Owns the view/edit toggle and, in edit mode, the
 * controlled form state. Keyed by item id upstream so it remounts (and resets)
 * whenever a different item is opened.
 */
function ItemDrawerContent({
  detail,
  onSaved,
  onDeleted,
}: {
  detail: ItemDetail;
  onSaved: (detail: ItemDetail) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);

  const typeName = detail.type.name;
  const showContent = CONTENT_TYPES.includes(typeName);
  const showLanguage = LANGUAGE_TYPES.includes(typeName);
  const showCode = CODE_TYPES.includes(typeName);
  const showMarkdown = MARKDOWN_TYPES.includes(typeName);
  const showUrl = typeName === "link";

  const [title, setTitle] = useState(detail.title);
  const [description, setDescription] = useState(detail.description ?? "");
  const [content, setContent] = useState(detail.content ?? "");
  const [language, setLanguage] = useState(detail.language ?? "");
  const [url, setUrl] = useState(detail.url ?? "");
  const [tagsInput, setTagsInput] = useState(detail.tags.join(", "));

  function seedFromDetail() {
    setTitle(detail.title);
    setDescription(detail.description ?? "");
    setContent(detail.content ?? "");
    setLanguage(detail.language ?? "");
    setUrl(detail.url ?? "");
    setTagsInput(detail.tags.join(", "));
  }

  function startEditing() {
    seedFromDetail();
    setMode("edit");
  }

  function cancelEditing() {
    seedFromDetail();
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateItem(detail.id, {
      title,
      description,
      content: showContent ? content : null,
      url: showUrl ? url : null,
      language: showLanguage ? language : null,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onSaved(result.data);
    setMode("view");
    toast.success("Item updated");
    router.refresh();
  }

  const canSave = title.trim().length > 0 && !saving;

  return (
    <>
      <SheetHeader className="gap-3 border-b p-6 pr-14">
        <div className="flex items-start gap-3">
          <ItemTypeTile type={detail.type} />
          <SheetTitle className="text-lg leading-tight">
            {mode === "edit" ? "Edit item" : detail.title}
          </SheetTitle>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{detail.type.label}</Badge>
          {mode === "view" && detail.language && (
            <Badge variant="secondary">{detail.language}</Badge>
          )}
        </div>

        {mode === "view" ? (
          <ViewActionBar
            detail={detail}
            onEdit={startEditing}
            onDeleted={onDeleted}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!canSave}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={cancelEditing}
            >
              Cancel
            </Button>
          </div>
        )}

        <SheetDescription className="sr-only">
          {detail.description ?? "Item details"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === "view" ? (
          <ItemDrawerBody detail={detail} />
        ) : (
          <div className="flex flex-col gap-6">
            <Field label="Title" htmlFor="item-title">
              <Input
                id="item-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </Field>

            <Field label="Description" htmlFor="item-description">
              <Textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </Field>

            {showContent &&
              (showCode ? (
                <Field label="Content">
                  <CodeEditor
                    value={content}
                    language={language}
                    onChange={setContent}
                  />
                </Field>
              ) : showMarkdown ? (
                <Field label="Content">
                  <MarkdownEditor value={content} onChange={setContent} />
                </Field>
              ) : (
                <Field label="Content" htmlFor="item-content">
                  <Textarea
                    id="item-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </Field>
              ))}

            {showLanguage && (
              <Field label="Language" htmlFor="item-language">
                <Input
                  id="item-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="e.g. typescript"
                />
              </Field>
            )}

            {showUrl && (
              <Field label="URL" htmlFor="item-url">
                <Input
                  id="item-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
            )}

            <Field label="Tags" htmlFor="item-tags">
              <Input
                id="item-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="comma, separated, tags"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas.
              </p>
            </Field>

            <ReadOnlyMeta detail={detail} />
          </div>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Type / collections / dates — shown in edit mode but not editable. */
function ReadOnlyMeta({ detail }: { detail: ItemDetail }) {
  return (
    <div className="flex flex-col gap-6 border-t pt-6">
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

/**
 * The favorite/pin/copy/edit/delete row. Favorite reflects the item's state
 * (amber when active); Favorite/Pin mutations land in a later feature — Copy,
 * Edit and Delete are wired up.
 */
function ViewActionBar({
  detail,
  onEdit,
  onDeleted,
}: {
  detail: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteItem(detail.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setConfirmOpen(false);
    onDeleted();
    toast.success("Item deleted");
    router.refresh();
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
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{detail.title}&rdquo; will be permanently deleted. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
