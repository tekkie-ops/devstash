/**
 * Single source of truth for the Language dropdown (snippet/command items)
 * and the Monaco language-id resolution CodeEditor uses for syntax
 * highlighting, so a value selected in the dropdown is guaranteed to be one
 * Monaco actually understands.
 */

export interface LanguageOption {
  value: string;
  label: string;
}

/** Canonical dropdown options — every value is a valid Monaco language id. */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "plaintext", label: "Plain Text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "shell", label: "Shell / Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "xml", label: "XML" },
];

const CANONICAL_VALUES = new Set(
  LANGUAGE_OPTIONS.map((option) => option.value),
);

/** Legacy shorthand -> canonical Monaco language id. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  rb: "ruby",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
};

/** Resolves any stored language string to a Monaco language id ("plaintext" if empty/unknown). */
export function toMonacoLanguage(language: string | null | undefined): string {
  const key = language?.trim().toLowerCase();
  if (!key) return "plaintext";
  return LANGUAGE_ALIASES[key] ?? key;
}

/**
 * Normalizes a stored language value for the dropdown: resolves legacy
 * shorthand (e.g. "ts", "py") to its canonical option, otherwise preserves
 * whatever free text was stored before this dropdown existed.
 */
export function normalizeLanguageValue(
  raw: string | null | undefined,
): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  const resolved = toMonacoLanguage(trimmed);
  return CANONICAL_VALUES.has(resolved) ? resolved : trimmed;
}

/**
 * Dropdown options for the given (already-normalized) current value: the
 * canonical list, plus the current value itself when it's a legacy/free-text
 * value that isn't one of the canonical options, so it still displays instead
 * of leaving the dropdown blank.
 */
export function languageOptionsFor(
  current: string,
): readonly LanguageOption[] {
  if (!current || CANONICAL_VALUES.has(current)) return LANGUAGE_OPTIONS;
  return [{ value: current, label: current }, ...LANGUAGE_OPTIONS];
}
