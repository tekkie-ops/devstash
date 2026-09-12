import { CodeEditor } from "@/components/items/CodeEditor";
import { Section } from "@/components/items/ItemDetailSection";
import { Field } from "@/components/items/ItemFormField";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate } from "@/lib/dashboard";
import type { ItemDetail } from "@/lib/db/items";

interface EditFormProps {
  detail: ItemDetail;
  title: string;
  onTitleChange: (value: string) => void;
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
  showContent: boolean;
  showCode: boolean;
  showMarkdown: boolean;
  showLanguage: boolean;
  showUrl: boolean;
}

/**
 * The item drawer's editable fields, plus the read-only type/collections/dates
 * block beneath them. Rendered in place of ItemDrawerBody while in edit mode.
 */
export function EditForm({
  detail,
  title,
  onTitleChange,
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
  showContent,
  showCode,
  showMarkdown,
  showLanguage,
  showUrl,
}: EditFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <Field label="Title" htmlFor="item-title">
        <Input
          id="item-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          required
        />
      </Field>

      <Field label="Description" htmlFor="item-description">
        <Textarea
          id="item-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
        />
      </Field>

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
          <Field label="Content" htmlFor="item-content">
            <Textarea
              id="item-content"
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
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
            onChange={(event) => onLanguageChange(event.target.value)}
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
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://…"
          />
        </Field>
      )}

      <Field label="Tags" htmlFor="item-tags">
        <Input
          id="item-tags"
          value={tagsInput}
          onChange={(event) => onTagsInputChange(event.target.value)}
          placeholder="comma, separated, tags"
        />
        <p className="text-xs text-muted-foreground">
          Separate tags with commas.
        </p>
      </Field>

      <ReadOnlyMeta detail={detail} />
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
