"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languageOptionsFor } from "@/lib/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * Language dropdown for snippet/command items, used above the content field
 * in both the New Item dialog and the item drawer's edit form. The selected
 * value drives CodeEditor's Monaco syntax highlighting live as the option
 * changes.
 */
export function LanguageSelect({ value, onChange, id }: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        {languageOptionsFor(value).map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
