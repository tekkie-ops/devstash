/**
 * Single source of truth for mock dashboard data.
 * Temporary stand-in for the database — replace with Prisma queries later.
 */

export type ContentType = "text" | "url" | "file";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  /** Machine name, matches the system types in the spec. */
  name: string;
  /** Plural label used in the sidebar. */
  label: string;
  /** lucide-react icon name. */
  icon: string;
  color: string;
  contentType: ContentType;
  isPro: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  defaultTypeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  typeId: string;
  contentType: ContentType;
  /** Set when contentType is "text". */
  content: string | null;
  /** Set when contentType is "url". */
  url: string | null;
  /** Set when contentType is "file". */
  fileName: string | null;
  fileSize: number | null;
  /** Syntax highlighting hint for snippets and commands. */
  language: string | null;
  tags: string[];
  collectionIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const currentUser: User = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  image: null,
  isPro: true,
};

export const itemTypes: ItemType[] = [
  {
    id: "type_snippet",
    name: "snippet",
    label: "Snippets",
    icon: "Code",
    color: "#3b82f6",
    contentType: "text",
    isPro: false,
  },
  {
    id: "type_prompt",
    name: "prompt",
    label: "Prompts",
    icon: "Sparkles",
    color: "#8b5cf6",
    contentType: "text",
    isPro: false,
  },
  {
    id: "type_command",
    name: "command",
    label: "Commands",
    icon: "Terminal",
    color: "#f97316",
    contentType: "text",
    isPro: false,
  },
  {
    id: "type_note",
    name: "note",
    label: "Notes",
    icon: "StickyNote",
    color: "#fde047",
    contentType: "text",
    isPro: false,
  },
  {
    id: "type_file",
    name: "file",
    label: "Files",
    icon: "File",
    color: "#6b7280",
    contentType: "file",
    isPro: true,
  },
  {
    id: "type_image",
    name: "image",
    label: "Images",
    icon: "Image",
    color: "#ec4899",
    contentType: "file",
    isPro: true,
  },
  {
    id: "type_link",
    name: "link",
    label: "Links",
    icon: "Link",
    color: "#10b981",
    contentType: "url",
    isPro: false,
  },
];

export const collections: Collection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    defaultTypeId: "type_snippet",
    createdAt: "2024-01-02T09:00:00.000Z",
    updatedAt: "2024-01-15T14:20:00.000Z",
  },
  {
    id: "col_python_snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    defaultTypeId: "type_snippet",
    createdAt: "2024-01-03T11:30:00.000Z",
    updatedAt: "2024-01-11T08:45:00.000Z",
  },
  {
    id: "col_context_files",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    defaultTypeId: "type_file",
    createdAt: "2024-01-04T16:10:00.000Z",
    updatedAt: "2024-01-14T10:05:00.000Z",
  },
  {
    id: "col_interview_prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    defaultTypeId: "type_note",
    createdAt: "2024-01-05T13:00:00.000Z",
    updatedAt: "2024-01-13T19:30:00.000Z",
  },
  {
    id: "col_git_commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    defaultTypeId: "type_command",
    createdAt: "2024-01-06T07:25:00.000Z",
    updatedAt: "2024-01-12T12:00:00.000Z",
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    defaultTypeId: "type_prompt",
    createdAt: "2024-01-07T15:40:00.000Z",
    updatedAt: "2024-01-16T09:15:00.000Z",
  },
];

export const items: Item[] = [
  {
    id: "item_use_auth",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    typeId: "type_snippet",
    contentType: "text",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react_patterns"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "item_api_error_handling",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    typeId: "type_snippet",
    contentType: "text",
    content: `export async function fetchWithRetry(url: string, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    await new Promise((r) => setTimeout(r, 2 ** attempt * 200))
  }
  throw new Error('Request failed after retries')
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["api", "fetch", "errors"],
    collectionIds: ["col_react_patterns", "col_interview_prep"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2024-01-12T09:30:00.000Z",
    updatedAt: "2024-01-12T09:30:00.000Z",
  },
  {
    id: "item_use_debounce",
    title: "useDebounce Hook",
    description: "Debounce a fast-changing value before using it",
    typeId: "type_snippet",
    contentType: "text",
    content: `export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["react", "hooks", "performance"],
    collectionIds: ["col_react_patterns"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-10T08:15:00.000Z",
    updatedAt: "2024-01-14T11:00:00.000Z",
  },
  {
    id: "item_compound_component",
    title: "Compound Component Pattern",
    description: "Share state between related components via context",
    typeId: "type_note",
    contentType: "text",
    content: `## Compound Components

Expose a parent that owns state and children that read it from context.

- \`<Tabs>\` owns the active tab
- \`<Tabs.List>\` and \`<Tabs.Panel>\` consume it
- Keeps the public API declarative`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["react", "patterns"],
    collectionIds: ["col_react_patterns"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-08T17:45:00.000Z",
    updatedAt: "2024-01-08T17:45:00.000Z",
  },
  {
    id: "item_react_docs_link",
    title: "React Docs — Reusing Logic with Hooks",
    description: "Official guide on extracting custom hooks",
    typeId: "type_link",
    contentType: "url",
    content: null,
    url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["react", "docs"],
    collectionIds: ["col_react_patterns"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-06T12:20:00.000Z",
    updatedAt: "2024-01-06T12:20:00.000Z",
  },
  {
    id: "item_py_batch_iter",
    title: "Batch an Iterable",
    description: "Split any iterable into fixed-size chunks",
    typeId: "type_snippet",
    contentType: "text",
    content: `from itertools import islice

def batched(iterable, n):
    it = iter(iterable)
    while batch := list(islice(it, n)):
        yield batch`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "python",
    tags: ["python", "itertools"],
    collectionIds: ["col_python_snippets"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-09T14:00:00.000Z",
    updatedAt: "2024-01-09T14:00:00.000Z",
  },
  {
    id: "item_py_retry_decorator",
    title: "Retry Decorator",
    description: "Retry a function with exponential backoff",
    typeId: "type_snippet",
    contentType: "text",
    content: `import time, functools

def retry(times=3, delay=0.2):
    def wrapper(fn):
        @functools.wraps(fn)
        def inner(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
                    time.sleep(delay * 2 ** attempt)
        return inner
    return wrapper`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "python",
    tags: ["python", "decorators"],
    collectionIds: ["col_python_snippets"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-07T10:10:00.000Z",
    updatedAt: "2024-01-11T08:45:00.000Z",
  },
  {
    id: "item_py_venv_notes",
    title: "Virtualenv Cheatsheet",
    description: "Creating and activating virtual environments",
    typeId: "type_note",
    contentType: "text",
    content: `python -m venv .venv        # create
source .venv/bin/activate   # macOS / Linux
.venv\\Scripts\\Activate.ps1  # Windows PowerShell
deactivate                  # exit`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["python", "tooling"],
    collectionIds: ["col_python_snippets"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-05T09:00:00.000Z",
    updatedAt: "2024-01-05T09:00:00.000Z",
  },
  {
    id: "item_claude_md",
    title: "CLAUDE.md — DevStash",
    description: "Project instructions handed to the coding agent",
    typeId: "type_file",
    contentType: "file",
    content: null,
    url: null,
    fileName: "CLAUDE.md",
    fileSize: 4820,
    language: null,
    tags: ["context", "ai"],
    collectionIds: ["col_context_files"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-04T16:30:00.000Z",
    updatedAt: "2024-01-14T10:05:00.000Z",
  },
  {
    id: "item_coding_standards_file",
    title: "Coding Standards",
    description: "TypeScript, React and Tailwind conventions",
    typeId: "type_file",
    contentType: "file",
    content: null,
    url: null,
    fileName: "coding-standards.md",
    fileSize: 2140,
    language: null,
    tags: ["context", "standards"],
    collectionIds: ["col_context_files"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-04T16:35:00.000Z",
    updatedAt: "2024-01-04T16:35:00.000Z",
  },
  {
    id: "item_architecture_diagram",
    title: "Architecture Diagram",
    description: "System overview exported from Excalidraw",
    typeId: "type_image",
    contentType: "file",
    content: null,
    url: null,
    fileName: "architecture.png",
    fileSize: 184320,
    language: null,
    tags: ["context", "architecture"],
    collectionIds: ["col_context_files"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-10T13:15:00.000Z",
    updatedAt: "2024-01-10T13:15:00.000Z",
  },
  {
    id: "item_big_o_note",
    title: "Big-O Cheatsheet",
    description: "Time complexity of common operations",
    typeId: "type_note",
    contentType: "text",
    content: `| Structure | Lookup | Insert | Delete |
|---|---|---|---|
| Array | O(n) | O(1)* | O(n) |
| Hash map | O(1) | O(1) | O(1) |
| Balanced BST | O(log n) | O(log n) | O(log n) |

*amortised, appending at the end`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["algorithms", "interview"],
    collectionIds: ["col_interview_prep"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2024-01-13T19:30:00.000Z",
    updatedAt: "2024-01-13T19:30:00.000Z",
  },
  {
    id: "item_system_design_link",
    title: "System Design Primer",
    description: "Repo covering scalability fundamentals",
    typeId: "type_link",
    contentType: "url",
    content: null,
    url: "https://github.com/donnemartin/system-design-primer",
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["interview", "system-design"],
    collectionIds: ["col_interview_prep"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-11T18:00:00.000Z",
    updatedAt: "2024-01-11T18:00:00.000Z",
  },
  {
    id: "item_behavioural_prompt",
    title: "Mock Interviewer Prompt",
    description: "Run a behavioural interview and score the answers",
    typeId: "type_prompt",
    contentType: "text",
    content: `You are a senior engineering manager running a behavioural interview.
Ask one STAR-format question at a time, wait for my answer, then score it
1-5 on structure, impact and clarity with one concrete improvement.`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["interview", "prompt"],
    collectionIds: ["col_interview_prep", "col_ai_prompts"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-09T20:00:00.000Z",
    updatedAt: "2024-01-09T20:00:00.000Z",
  },
  {
    id: "item_git_undo_commit",
    title: "Undo Last Commit (Keep Changes)",
    description: "Reset the last commit but keep the work staged",
    typeId: "type_command",
    contentType: "text",
    content: "git reset --soft HEAD~1",
    url: null,
    fileName: null,
    fileSize: null,
    language: "bash",
    tags: ["git", "undo"],
    collectionIds: ["col_git_commands"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-06T07:30:00.000Z",
    updatedAt: "2024-01-06T07:30:00.000Z",
  },
  {
    id: "item_git_prune_branches",
    title: "Prune Merged Branches",
    description: "Delete local branches already merged into master",
    typeId: "type_command",
    contentType: "text",
    content: "git branch --merged master | grep -v master | xargs git branch -d",
    url: null,
    fileName: null,
    fileSize: null,
    language: "bash",
    tags: ["git", "cleanup"],
    collectionIds: ["col_git_commands"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-08T11:00:00.000Z",
    updatedAt: "2024-01-12T12:00:00.000Z",
  },
  {
    id: "item_git_interactive_rebase_note",
    title: "Interactive Rebase Steps",
    description: "Squashing a messy branch before opening a PR",
    typeId: "type_note",
    contentType: "text",
    content: `1. \`git rebase -i master\`
2. Mark commits to keep as \`pick\`, the rest as \`squash\`
3. Rewrite the combined message
4. \`git push --force-with-lease\``,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["git", "rebase"],
    collectionIds: ["col_git_commands"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-09T09:45:00.000Z",
    updatedAt: "2024-01-09T09:45:00.000Z",
  },
  {
    id: "item_code_review_prompt",
    title: "Code Review Prompt",
    description: "Ask for a focused review of a diff",
    typeId: "type_prompt",
    contentType: "text",
    content: `Review this diff for correctness bugs, security issues and unnecessary
complexity. List findings most severe first. For each one give the file,
the concrete failure scenario, and the smallest fix. Skip style nits.`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["prompt", "review"],
    collectionIds: ["col_ai_prompts"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-16T09:15:00.000Z",
    updatedAt: "2024-01-16T09:15:00.000Z",
  },
  {
    id: "item_commit_message_prompt",
    title: "Commit Message Generator",
    description: "Turn a staged diff into a conventional commit",
    typeId: "type_prompt",
    contentType: "text",
    content: `Read the staged diff and write a conventional commit message.
One line summary under 72 characters, then a short body explaining why
the change was needed. No marketing language.`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["prompt", "git"],
    collectionIds: ["col_ai_prompts", "col_git_commands"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-14T15:00:00.000Z",
    updatedAt: "2024-01-14T15:00:00.000Z",
  },
  {
    id: "item_prompt_engineering_link",
    title: "Anthropic Prompt Engineering Guide",
    description: "Official guidance on structuring prompts",
    typeId: "type_link",
    contentType: "url",
    content: null,
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["prompt", "docs"],
    collectionIds: ["col_ai_prompts"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-07T16:00:00.000Z",
    updatedAt: "2024-01-07T16:00:00.000Z",
  },
];