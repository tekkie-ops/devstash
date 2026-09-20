import type { BeforeMount } from "@monaco-editor/react";

import type { EditorPreferences } from "@/lib/validations/editor-preferences";

/** Maps an EditorPreferences theme id to the Monaco theme name defined by defineCodeEditorThemes. */
export const MONACO_THEME_NAMES: Record<EditorPreferences["theme"], string> = {
  "vs-dark": "devstash-vs-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

export function defineCodeEditorThemes(monaco: Parameters<BeforeMount>[0]) {
  monaco.editor.defineTheme(MONACO_THEME_NAMES["vs-dark"], {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0d0d0d",
      "editorGutter.background": "#0d0d0d",
      "editorLineNumber.foreground": "#4b4b4b",
      "editorLineNumber.activeForeground": "#a1a1a1",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#1a1a1a",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });

  monaco.editor.defineTheme(MONACO_THEME_NAMES.monokai, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editorGutter.background": "#272822",
      "editorLineNumber.foreground": "#75715e",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#3e3d32",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });

  monaco.editor.defineTheme(MONACO_THEME_NAMES["github-dark"], {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e" },
      { token: "string", foreground: "a5d6ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "c9d1d9" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editorGutter.background": "#0d1117",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b22",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#161b22",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });
}
