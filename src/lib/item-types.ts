/**
 * Shared system item-type metadata: the canonical ordering, the display-label
 * rule, and the "which type shows which field" groups used by the item drawer
 * and the New Item dialog. Single source of truth — previously copied across
 * the db query files and both item form components.
 */

/** Canonical system-type ordering used across the UI (see project-overview.md). */
export const SYSTEM_TYPE_ORDER: readonly string[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

/** e.g. "snippet" -> "Snippets", matching the plural labels used elsewhere in the UI. */
export function toLabel(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

/** Type names whose items carry an editable free-text body. */
export const CONTENT_TYPES: readonly string[] = [
  "snippet",
  "prompt",
  "command",
  "note",
];

/** Type names whose items carry an editable language tag. */
export const LANGUAGE_TYPES: readonly string[] = ["snippet", "command"];

/** Type names whose body is code — shown in a Monaco editor, not a textarea. */
export const CODE_TYPES: readonly string[] = ["snippet", "command"];

/** Type names whose body is prose — shown in a Markdown editor with Write/Preview. */
export const MARKDOWN_TYPES: readonly string[] = ["note", "prompt"];
