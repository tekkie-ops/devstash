"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CollectionItemType } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

/** Type names whose items carry a free-text body. */
const CONTENT_TYPES = ["snippet", "prompt", "command", "note"];
/** Type names whose items carry a language tag. */
const LANGUAGE_TYPES = ["snippet", "command"];

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

  const showContent = CONTENT_TYPES.includes(typeName);
  const showLanguage = LANGUAGE_TYPES.includes(typeName);
  const showUrl = typeName === "link";

  function reset() {
    setTypeName(fallbackType);
    setTitle("");
    setDescription("");
    setContent("");
    setLanguage("");
    setUrl("");
    setTagsInput("");
  }

  function handleOpenChange(next: boolean) {
    if (submitting) return;
    setOpen(next);
    if (!next) reset();
  }

  const canSubmit =
    title.trim().length > 0 &&
    (!showUrl || url.trim().length > 0) &&
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
            Add a snippet, prompt, command, note, or link to your stash.
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
                      onClick={() => setTypeName(type.name)}
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

            {showContent && (
              <Field label="Content" htmlFor="create-item-content">
                <Textarea
                  id="create-item-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  className="font-mono text-xs"
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
