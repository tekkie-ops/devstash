"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { CreateItemFields } from "@/components/items/CreateItemFields";
import { CreateItemTypeSelector } from "@/components/items/CreateItemTypeSelector";
import type { UploadedFile } from "@/components/items/FileUpload";
import { Field } from "@/components/items/ItemFormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  CollectionItemType,
  CollectionOption,
} from "@/lib/db/collections";
import {
  CODE_TYPES,
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  MARKDOWN_TYPES,
} from "@/lib/item-types";
import { FILE_ITEM_TYPES } from "@/lib/validations/items";

/**
 * The "New Item" entry point in the top bar. Opens a modal with a type selector
 * and the fields relevant to that type, then calls the `createItem` server
 * action. On success: toast, close, and refresh so the new item shows up.
 */
export function CreateItemDialog({
  types,
  collections,
  isPro,
}: {
  types: CollectionItemType[];
  collections: CollectionOption[];
  isPro: boolean;
}) {
  const router = useRouter();
  const fallbackType = types[0]?.name ?? "snippet";

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [typeName, setTypeName] = useState(fallbackType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const showContent = CONTENT_TYPES.includes(typeName);
  const showLanguage = LANGUAGE_TYPES.includes(typeName);
  const showCode = CODE_TYPES.includes(typeName);
  const showMarkdown = MARKDOWN_TYPES.includes(typeName);
  const showUrl = typeName === "link";
  const showFile = (FILE_ITEM_TYPES as readonly string[]).includes(typeName);

  function reset() {
    setTypeName(fallbackType);
    setTitle("");
    setDescription("");
    setContent("");
    setLanguage("");
    setUrl("");
    setTagsInput("");
    setCollectionIds([]);
    setUploadedFile(null);
    setUploading(false);
  }

  function handleTypeChange(name: string) {
    setTypeName(name);
    setUploadedFile(null);
    setUploading(false);
  }

  function addTag(tag: string) {
    setTagsInput((prev) => {
      const tags = prev
        .split(",")
        .map((existing) => existing.trim())
        .filter(Boolean);
      if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        return prev;
      }
      return [...tags, tag].join(", ");
    });
  }

  function handleOpenChange(next: boolean) {
    if (submitting) return;
    setOpen(next);
    if (!next) reset();
  }

  const canSubmit =
    title.trim().length > 0 &&
    (!showUrl || url.trim().length > 0) &&
    (!showFile || uploadedFile !== null) &&
    !uploading &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await createItem({
      type: typeName,
      title,
      description,
      content: showContent ? content : null,
      url: showUrl ? url : null,
      language: showLanguage ? language : null,
      fileUrl: showFile ? uploadedFile?.fileUrl ?? null : null,
      fileName: showFile ? uploadedFile?.fileName ?? null : null,
      fileSize: showFile ? uploadedFile?.fileSize ?? null : null,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      collectionIds,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Item created");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="New Item">
          <Plus />
          <span className="hidden sm:inline">New Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-6 pr-14">
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, link, file, or image to your
            stash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-6 p-6">
            <Field label="Type">
              <CreateItemTypeSelector
                types={types}
                value={typeName}
                onChange={handleTypeChange}
              />
            </Field>

            <Field label="Title" htmlFor="create-item-title">
              <Input
                id="create-item-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                autoFocus
              />
            </Field>

            <CreateItemFields
              typeName={typeName}
              isPro={isPro}
              collections={collections}
              title={title}
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
              onAddTag={addTag}
              collectionIds={collectionIds}
              onCollectionIdsChange={setCollectionIds}
              uploadedFile={uploadedFile}
              onUploadedFileChange={setUploadedFile}
              onUploadingChange={setUploading}
              showContent={showContent}
              showLanguage={showLanguage}
              showCode={showCode}
              showMarkdown={showMarkdown}
              showUrl={showUrl}
              showFile={showFile}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t p-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Creating…" : "Create item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
