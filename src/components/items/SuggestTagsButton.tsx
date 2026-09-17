"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SuggestTagsButtonProps {
  title: string;
  description: string;
  content: string;
  existingTags: string[];
  onAcceptTag: (tag: string) => void;
}

/**
 * Pro-only "Suggest tags" trigger for the create-item dialog and the drawer's
 * edit form. Sends the form's *current* (possibly unsaved) title/description/
 * content to the generateAutoTags action, then renders each suggestion as a
 * dashed badge with accept/reject controls — accepting adds it via
 * onAcceptTag, rejecting just drops it from the list. Rendered only when the
 * caller has already confirmed the signed-in user is Pro.
 */
export function SuggestTagsButton({
  title,
  description,
  content,
  existingTags,
  onAcceptTag,
}: SuggestTagsButtonProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    const result = await generateAutoTags({ title, description, content });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const existing = new Set(existingTags.map((tag) => tag.toLowerCase()));
    setSuggestions(
      result.data.tags.filter((tag) => !existing.has(tag.toLowerCase())),
    );
  }

  function accept(tag: string) {
    onAcceptTag(tag);
    setSuggestions((prev) => prev.filter((suggestion) => suggestion !== tag));
  }

  function reject(tag: string) {
    setSuggestions((prev) => prev.filter((suggestion) => suggestion !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={handleSuggest}
        disabled={loading || title.trim().length === 0}
      >
        <Sparkles className="size-3.5" />
        {loading ? "Suggesting…" : "Suggest tags"}
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 border-dashed pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => accept(tag)}
                aria-label={`Accept tag ${tag}`}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <Check className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => reject(tag)}
                aria-label={`Reject tag ${tag}`}
                className="rounded-full p-0.5 hover:bg-destructive/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
