"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

import { generateDescription } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateDescriptionButtonProps {
  title: string;
  content?: string;
  url?: string;
  language?: string;
  fileName?: string;
  onGenerated: (description: string) => void;
  className?: string;
}

/**
 * Pro-only icon button that fills the Description field from whatever fields
 * are currently available on the form (title always, plus content/url/
 * language/fileName when the item type has them) — works before the item is
 * saved, for every item type, since the generateDescription action tolerates
 * any subset of those fields being blank. Absolutely positioned over the
 * Description textarea by the caller. Rendered only when the caller has
 * already confirmed the signed-in user is Pro.
 */
export function GenerateDescriptionButton({
  title,
  content = "",
  url = "",
  language = "",
  fileName = "",
  onGenerated,
  className,
}: GenerateDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const result = await generateDescription({
      title,
      content,
      url,
      language,
      fileName,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onGenerated(result.data.description);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("text-muted-foreground", className)}
      onClick={handleGenerate}
      disabled={loading || title.trim().length === 0}
      aria-label={loading ? "Generating description…" : "Generate description"}
      title="Generate description"
    >
      <Wand2 className={cn("size-3.5", loading && "animate-pulse")} />
    </Button>
  );
}
