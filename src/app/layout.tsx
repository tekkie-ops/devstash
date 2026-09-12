import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";
import { Toaster } from "@/components/ui/sonner";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/validations/editor-preferences";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevStash",
  description: "One fast, searchable hub for all developer knowledge & resources.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const userId = session?.user?.id;
  const editorPreferences = userId
    ? await getEditorPreferences(userId)
    : DEFAULT_EDITOR_PREFERENCES;

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EditorPreferencesProvider initialPreferences={editorPreferences}>
          {children}
        </EditorPreferencesProvider>
        <Toaster />
      </body>
    </html>
  );
}
