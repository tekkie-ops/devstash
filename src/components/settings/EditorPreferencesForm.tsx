"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

const THEME_LABELS: Record<EditorPreferences["theme"], string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

/**
 * Font size / tab size / word wrap / minimap / theme controls for the Monaco
 * editor, auto-saved on every change via EditorPreferencesContext — no save
 * button, per the spec.
 */
export function EditorPreferencesForm() {
  const { preferences, setPreferences } = useEditorPreferences();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-font-size">Font size</Label>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(value) =>
            setPreferences({ ...preferences, fontSize: Number(value) as EditorPreferences["fontSize"] })
          }
        >
          <SelectTrigger id="editor-font-size" size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_FONT_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-tab-size">Tab size</Label>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(value) =>
            setPreferences({ ...preferences, tabSize: Number(value) as EditorPreferences["tabSize"] })
          }
        >
          <SelectTrigger id="editor-tab-size" size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_TAB_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-theme">Theme</Label>
        <Select
          value={preferences.theme}
          onValueChange={(value) =>
            setPreferences({ ...preferences, theme: value as EditorPreferences["theme"] })
          }
        >
          <SelectTrigger id="editor-theme" size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_THEMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-word-wrap">Word wrap</Label>
        <Switch
          id="editor-word-wrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-minimap">Minimap</Label>
        <Switch
          id="editor-minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, minimap: checked })}
        />
      </div>
    </div>
  );
}
