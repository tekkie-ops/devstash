"use client";

import { CodeEditor } from "@/components/items/CodeEditor";
import { CollectionMultiSelect } from "@/components/items/CollectionMultiSelect";
import { FileUpload, type UploadedFile } from "@/components/items/FileUpload";
import { GenerateDescriptionButton } from "@/components/items/GenerateDescriptionButton";
import { Field } from "@/components/items/ItemFormField";
import { LanguageSelect } from "@/components/items/LanguageSelect";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { SuggestTagsButton } from "@/components/items/SuggestTagsButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CollectionOption } from "@/lib/db/collections";
import type { UploadKind } from "@/lib/upload";

interface CreateItemFieldsProps {
  typeName: string;
  isPro: boolean;
  collections: CollectionOption[];

  title: string;

  description: string;
  onDescriptionChange: (value: string) => void;

  content: string;
  onContentChange: (value: string) => void;

  language: string;
  onLanguageChange: (value: string) => void;

  url: string;
  onUrlChange: (value: string) => void;

  tagsInput: string;
  onTagsInputChange: (value: string) => void;
  onAddTag: (tag: string) => void;

  collectionIds: string[];
  onCollectionIdsChange: (ids: string[]) => void;

  uploadedFile: UploadedFile | null;
  onUploadedFileChange: (file: UploadedFile | null) => void;
  onUploadingChange: (uploading: boolean) => void;

  showContent: boolean;
  showLanguage: boolean;
  showCode: boolean;
  showMarkdown: boolean;
  showUrl: boolean;
  showFile: boolean;
}

/**
 * The Description/Language/Content/File/URL/Tags/Collections field block for
 * the New Item dialog — which fields render depends on the selected type's
 * show-flags, computed by the caller from CONTENT_TYPES/LANGUAGE_TYPES/etc.
 */
export function CreateItemFields({
  typeName,
  isPro,
  collections,
  title,
  description,
  onDescriptionChange,
  content,
  onContentChange,
  language,
  onLanguageChange,
  url,
  onUrlChange,
  tagsInput,
  onTagsInputChange,
  onAddTag,
  collectionIds,
  onCollectionIdsChange,
  uploadedFile,
  onUploadedFileChange,
  onUploadingChange,
  showContent,
  showLanguage,
  showCode,
  showMarkdown,
  showUrl,
  showFile,
}: CreateItemFieldsProps) {
  return (
    <>
      <Field label="Description" htmlFor="create-item-description">
        <div className="relative">
          <Textarea
            id="create-item-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={2}
            className="pr-9"
          />
          {isPro && (
            <GenerateDescriptionButton
              className="absolute top-1.5 right-1.5"
              title={title}
              content={showContent ? content : ""}
              url={showUrl ? url : ""}
              language={showLanguage ? language : ""}
              fileName={showFile ? (uploadedFile?.fileName ?? "") : ""}
              onGenerated={onDescriptionChange}
            />
          )}
        </div>
      </Field>

      {showLanguage && (
        <Field label="Language" htmlFor="create-item-language">
          <LanguageSelect
            id="create-item-language"
            value={language}
            onChange={onLanguageChange}
          />
        </Field>
      )}

      {showContent &&
        (showCode ? (
          <Field label="Content">
            <CodeEditor
              value={content}
              language={language}
              onChange={onContentChange}
            />
          </Field>
        ) : showMarkdown ? (
          <Field label="Content">
            <MarkdownEditor value={content} onChange={onContentChange} />
          </Field>
        ) : (
          <Field label="Content" htmlFor="create-item-content">
            <Textarea
              id="create-item-content"
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
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
            onChange={onUploadedFileChange}
            onUploadingChange={onUploadingChange}
          />
        </Field>
      )}

      {showUrl && (
        <Field label="URL" htmlFor="create-item-url">
          <Input
            id="create-item-url"
            type="url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://…"
            required
          />
        </Field>
      )}

      <Field label="Tags" htmlFor="create-item-tags">
        <Input
          id="create-item-tags"
          value={tagsInput}
          onChange={(event) => onTagsInputChange(event.target.value)}
          placeholder="comma, separated, tags"
        />
        <p className="text-xs text-muted-foreground">
          Separate tags with commas.
        </p>
        {isPro && (
          <SuggestTagsButton
            title={title}
            description={description}
            content={content}
            existingTags={tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)}
            onAcceptTag={onAddTag}
          />
        )}
      </Field>

      <Field label="Collections">
        <CollectionMultiSelect
          collections={collections}
          selectedIds={collectionIds}
          onChange={onCollectionIdsChange}
        />
      </Field>
    </>
  );
}
