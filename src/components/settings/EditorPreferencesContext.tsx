"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import type { EditorPreferences } from "@/lib/validations/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  /** Optimistically applies the change, then auto-saves and toasts the result. */
  setPreferences: (next: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(
  null,
);

export function useEditorPreferences(): EditorPreferencesContextValue {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error(
      "useEditorPreferences must be used within an EditorPreferencesProvider",
    );
  }
  return context;
}

/**
 * App-wide editor preferences (font size, tab size, word wrap, minimap,
 * theme). Mounted once in the root layout with the signed-in user's saved
 * preferences (or defaults) so every Monaco instance — the settings form, the
 * item drawer, and the create-item dialog — reads from the same source.
 */
export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferencesState] = useState(initialPreferences);

  const setPreferences = useCallback((next: EditorPreferences) => {
    setPreferencesState(next);
    void updateEditorPreferences(next).then((result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Editor preferences saved");
    });
  }, []);

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
