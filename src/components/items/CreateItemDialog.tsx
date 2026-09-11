"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { CodeEditor } from "@/components/items/CodeEditor";
import { FileUpload, type UploadedFile } from "@/components/items/FileUpload";
import { Field } from "@/components/items/ItemFormField";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
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
import { Textarea } from "@/components/ui/textarea";
import type { CollectionItemType } from "@/lib/db/collections";
import {
  CODE_TYPES,
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  MARKDOWN_TYPES,
} from "@/lib/item-types";
import type { UploadKind } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { FILE_ITEM_TYPES } from "@/lib/validations/items";

/**
 * The "New Item" entry point in the top bar. Opens a modal with a type selector
 * and the fields relevant to that type, then calls the `createItem` server
 * action. On success: toast, close, and refresh so the new item shows up.
 */
export function CreateItemDialog({ types }: { types: CollectionItemType[] }) {
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
    setUploadedFile(null);
    setUploading(false);
  }

  function handleTypeChange(name: string) {
    setTypeName(name);
    setUploadedFile(null);
    setUploading(false);
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
        <Button>
          <Plus />
          New Item
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
              <div className="flex flex-wrap gap-2">
                {types.map((type) => {
                  const selected = typeName === type.name;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeChange(type.name)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ItemTypeIcon type={type} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
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

            <Field label="Description" htmlFor="create-item-description">
              <Textarea
                id="create-item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
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
                <Field label="Content" htmlFor="create-item-content">
                  <Textarea
                    id="create-item-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </Field>
              ))}

            {showFile && (
              <Field label={typeName === "image" ? "Image" : "File"}>
                <FileUpload
                  kind={typeName as UploadKind}
                  value={uploadedFile}
                  onChange={setUploadedFile}
                  onUploadingChange={setUploading}
                />
              </Field>
            )}

            {showLanguage && (
              <Field label="Language" htmlFor="create-item-language">
                <Input
                  id="create-item-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="e.g. typescript"
                />
              </Field>
            )}

            {showUrl && (
              <Field label="URL" htmlFor="create-item-url">
                <Input
                  id="create-item-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://…"
                  required
                />
              </Field>
            )}

            <Field label="Tags" htmlFor="create-item-tags">
              <Input
                id="create-item-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="comma, separated, tags"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas.
              </p>
            </Field>
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
