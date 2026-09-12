"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import { EditForm } from "@/components/items/ItemDrawerEditForm";
import { ItemDrawerBody } from "@/components/items/ItemDrawerView";
import { ViewActionBar } from "@/components/items/ItemDrawerActionBar";
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
import type { CollectionOption } from "@/lib/db/collections";
import type { ItemDetail } from "@/lib/db/items";
import {
  CODE_TYPES,
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  MARKDOWN_TYPES,
} from "@/lib/item-types";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ItemDetail | null;
  loading: boolean;
  error: string | null;
  /** The signed-in user's collections, for the edit form's collection picker. */
  availableCollections: CollectionOption[];
  /** Called with the refreshed detail after a successful save. */
  onSaved: (detail: ItemDetail) => void;
  /** Called after a successful delete — closes the drawer and clears detail. */
  onDeleted: () => void;
  /** Called with the refreshed detail after a successful favorite toggle. */
  onFavorited: (detail: ItemDetail) => void;
  /** Called with the (optimistically or server) refreshed detail after a pin toggle. */
  onPinned: (detail: ItemDetail) => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  detail,
  loading,
  error,
  availableCollections,
  onSaved,
  onDeleted,
  onFavorited,
  onPinned,
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
            availableCollections={availableCollections}
            onSaved={onSaved}
            onDeleted={onDeleted}
            onFavorited={onFavorited}
            onPinned={onPinned}
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
  availableCollections,
  onSaved,
  onDeleted,
  onFavorited,
  onPinned,
}: {
  detail: ItemDetail;
  availableCollections: CollectionOption[];
  onSaved: (detail: ItemDetail) => void;
  onDeleted: () => void;
  onFavorited: (detail: ItemDetail) => void;
  onPinned: (detail: ItemDetail) => void;
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
  const [collectionIds, setCollectionIds] = useState(
    detail.collections.map((collection) => collection.id),
  );

  function seedFromDetail() {
    setTitle(detail.title);
    setDescription(detail.description ?? "");
    setContent(detail.content ?? "");
    setLanguage(detail.language ?? "");
    setUrl(detail.url ?? "");
    setTagsInput(detail.tags.join(", "));
    setCollectionIds(detail.collections.map((collection) => collection.id));
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
      collectionIds,
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
            onFavorited={onFavorited}
            onPinned={onPinned}
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
          <EditForm
            detail={detail}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            content={content}
            onContentChange={setContent}
            language={language}
            onLanguageChange={setLanguage}
            url={url}
            onUrlChange={setUrl}
            tagsInput={tagsInput}
            onTagsInputChange={setTagsInput}
            collectionIds={collectionIds}
            onCollectionIdsChange={setCollectionIds}
            availableCollections={availableCollections}
            showContent={showContent}
            showCode={showCode}
            showMarkdown={showMarkdown}
            showLanguage={showLanguage}
            showUrl={showUrl}
          />
        )}
      </div>
    </>
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
