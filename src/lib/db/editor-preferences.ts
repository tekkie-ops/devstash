import { prisma } from "@/lib/prisma";
import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return parseEditorPreferences(user?.editorPreferences);
}

export async function updateEditorPreferences(
  userId: string,
  data: EditorPreferences,
): Promise<EditorPreferences> {
  await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: data },
  });

  return data;
}
