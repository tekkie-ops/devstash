# Item CRUD Architecture

> Design for a unified create/read/update/delete system covering all 7 item
> types (`snippet`, `prompt`, `note`, `command`, `link`, `file`, `image`).
> Design doc — none of this is implemented yet. Written 2026-09-07.

## Source note

The prompt referenced `@src/lib/constants.tsx` (does not exist — type constants
live in `prisma/seed.ts`, `src/lib/mock-data.ts`, `src/lib/icons.ts`; see
[`docs/item-types.md`](./item-types.md)) and `@docs/content-types.md` (the actual
file is [`docs/item-types.md`](./item-types.md)).

## Design goals (from the prompt)

1. **Mutations in one action file** — `src/actions/items.ts` holds `createItem`,
   `updateItem`, `deleteItem` for every type.
2. **Queries in `src/lib/db`** — called directly from async server components,
   never from actions (except re-reads needed for authorization).
3. **One dynamic route + shared components that adapt by type** — `/items/[type]`,
   with type-specific behavior isolated to small field components, not the route
   or the actions.

---

## 1. Existing patterns this builds on

| Concern | Current convention | Files |
|---|---|---|
| Mutations | `"use server"` action, `auth()` guard at top, Zod `safeParse`, returns `{ success, error }` (or `{ success, data, error }`), `try/catch`, client surfaces errors via `toast` | `src/actions/profile.ts`, `src/actions/auth.ts` |
| Client forms | `"use client"` + `useActionState(action, initialState)`, `useEffect` on `state` for toast + `formRef.reset()` | `src/components/profile/ChangePasswordForm.tsx` |
| Validation | One Zod schema module per feature, `z.infer` exported, shared between action and client | `src/lib/validations/auth.ts` |
| Queries | Plain `async function` in `src/lib/db/*.ts`, returns a mapped "Summary" shape (not raw Prisma rows), scoped by user | `src/lib/db/items.ts`, `collections.ts`, `profile.ts` |
| Query→component | Async server component calls the `lib/db` fn itself and renders; page just composes sections | `src/components/dashboard/RecentItems.tsx`, `src/app/dashboard/page.tsx` |
| User scoping | `getDemoUserId()` (React `cache()`-wrapped) for dashboard code; explicit `userId` param where a real session exists (`profile.ts`) | `src/lib/db/user.ts` |
| Type rendering | Data-driven off `icon` + `color`; `ItemTypeIcon` / `ItemTypeTile` accept a minimal `IconableType`; `ItemRow` already renders any type | `src/components/dashboard/ItemTypeIcon.tsx`, `ItemRow.tsx` |
| Route protection | `src/proxy.ts` `matcher` array; unauthenticated → `/sign-in?callbackUrl=…` | `src/proxy.ts` |
| Type route target | Sidebar already links each type to `/items/{label-lowercased}` e.g. `/items/snippets` | `src/components/dashboard/SidebarTypesNav.tsx` |

`coding-standards.md` rules that shape the design:
- Server Components by default; `'use client'` only for interactivity.
- **Server Actions for form submissions and simple mutations.** API routes only
  for webhooks, **file uploads with progress**, long-running ops, specific
  status/headers, or future mobile/CLI clients.
- Validate all inputs with Zod.
- `{ success, data, error }` from actions; user-friendly errors via toast.
- Components at `src/components/[feature]/ComponentName.tsx`; actions at
  `src/actions/[feature].ts`; types at `src/types/[feature].ts`.

---

## 2. Proposed file structure

```
src/
  actions/
    items.ts                     # NEW — createItem / updateItem / deleteItem (all 7 types)

  lib/
    validations/
      item.ts                    # NEW — shared Zod schemas (discriminated by content kind)
    db/
      items.ts                   # EXTEND — add getItemById, getItemsByType, getItemForEdit
      item-types.ts              # NEW — getSystemItemTypes, resolveTypeBySlug, TYPE_SLUGS
                                 #        (dedupes SYSTEM_TYPE_ORDER + toLabel, copied in 3 files today)

  app/
    items/
      [type]/
        page.tsx                 # NEW — list view for one type (async server component)
        loading.tsx              # NEW — skeleton
        not-found.tsx            # NEW — unknown type slug

  components/
    items/
      ItemListView.tsx           # server — header (type name + count + New button) + grid + empty state
      ItemGrid.tsx               # server — maps ItemSummary[] -> <ItemRow> (reuse dashboard ItemRow)
      NewItemButton.tsx          # client — opens the drawer, preselects the current type
      ItemDrawer.tsx             # client — shadcn sheet; hosts ItemForm for create OR edit
      ItemForm.tsx               # client — shared fields + <TypeContentField>; useActionState
      TypeContentField.tsx       # client — switch on type.contentKind -> one field component
      fields/
        TextContentField.tsx     # snippet / prompt / note / command  (textarea; + language select for snippet/command; + md preview for note)
        LinkContentField.tsx     # link  (url input + validation UX)
        FileContentField.tsx     # file / image  (dropzone -> POST /api/items/upload -> hidden fileUrl/fileName/fileSize)
      ItemTagsField.tsx          # client — tag input (chips)
      ItemCollectionsField.tsx   # client — multi-select of the user's collections

  app/
    api/
      items/
        upload/route.ts          # NEW — the ONLY API route; multipart -> Cloudflare R2 -> { fileUrl, fileName, fileSize }
```

Not in scope here (later features): the item detail page / quick-access drawer
open-from-row, search, import-from-file. `ItemRow` is deliberately still
non-clickable (noted in its own source).

---

## 3. How `/items/[type]` routing works

### The slug

`[type]` is the **lowercased plural label**: `snippets`, `prompts`, `notes`,
`commands`, `links`, `files`, `images`. This is already the URL the sidebar
generates (`itemTypeHref` in `SidebarTypesNav.tsx`), so the route just has to
match it.

### Resolution

`src/lib/db/item-types.ts`:

```ts
// canonical order, single copy (currently duplicated in items.ts, profile.ts, ...)
export const SYSTEM_TYPE_ORDER = ["snippet","prompt","command","note","file","image","link"] as const;
export type SystemTypeName = (typeof SYSTEM_TYPE_ORDER)[number];

export const toLabel  = (name: string) => `${name[0].toUpperCase()}${name.slice(1)}s`;
export const toSlug   = (name: string) => toLabel(name).toLowerCase();      // "snippet" -> "snippets"
export const fromSlug = (slug: string): SystemTypeName | null =>
  SYSTEM_TYPE_ORDER.find((n) => toSlug(n) === slug) ?? null;

// content kind drives storage + which editor widget renders
export const CONTENT_KIND: Record<SystemTypeName, "text" | "url" | "file"> = {
  snippet: "text", prompt: "text", command: "text", note: "text",
  link: "url", file: "file", image: "file",
};

export async function getSystemItemTypes(): Promise<ItemTypeMeta[]> { /* prisma.itemType.findMany({ where:{ isSystem:true }}) sorted by SYSTEM_TYPE_ORDER */ }
export async function resolveTypeBySlug(slug: string): Promise<ItemTypeMeta | null> { /* fromSlug + findFirst({ where:{ isSystem:true, name }}) */ }
```

### `src/app/items/[type]/page.tsx` (server component)

```tsx
export function generateStaticParams() {
  return SYSTEM_TYPE_ORDER.map((name) => ({ type: toSlug(name) }));
}

export default async function ItemTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const itemType = await resolveTypeBySlug(type);
  if (!itemType) notFound();

  const items = await getItemsByType(itemType.name);   // lib/db, called directly
  return <ItemListView type={itemType} items={items} />;
}
```

- Unknown slug → `notFound()` → `not-found.tsx`.
- One route file serves all 7 types. No per-type route files.
- Add `"/items/:path*"` to `src/proxy.ts` `matcher` so the list views are
  auth-gated like `/dashboard` and `/profile`.

---

## 4. Where type-specific logic lives — components, not actions

### Actions are type-generic

`src/actions/items.ts` never has a 7-way `switch` on type name. It branches at
most on the **3 content kinds** (text / url / file), and even that is only
"which nullable columns do I write":

```ts
"use server";

export type ItemMutationState = { success: boolean; error?: string; data?: { id: string } };

export async function createItem(_prev: ItemMutationState, formData: FormData): Promise<ItemMutationState> {
  const userId = await requireUserId();                       // auth() guard, like profile.ts
  const parsed = createItemSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { success: false, error: firstIssue(parsed) };

  const { itemTypeId, title, description, tags, collectionIds, content } = parsed.data;
  // `content` is a discriminated union: {kind:"text", body, language?} | {kind:"url", url} | {kind:"file", fileUrl, fileName, fileSize}

  const item = await prisma.item.create({
    data: {
      title, description, userId, itemTypeId,
      contentType: content.kind === "file" ? "file" : "text",   // Prisma enum has only text|file
      content:  content.kind === "text" ? content.body : null,
      language: content.kind === "text" ? content.language ?? null : null,
      url:      content.kind === "url"  ? content.url : null,
      fileUrl:  content.kind === "file" ? content.fileUrl : null,
      fileName: content.kind === "file" ? content.fileName : null,
      fileSize: content.kind === "file" ? content.fileSize : null,
      tags:        { connectOrCreate: tags.map(connectOrCreateTag) },
      collections: { create: collectionIds.map((collectionId) => ({ collectionId })) },
    },
  });

  revalidatePath(`/items/${toSlug(/* type name */)}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id: item.id } };
}
```

`updateItem(id, …)` — re-reads the row to confirm `item.userId === userId`
(authorization), then a `prisma.item.update` with the same column mapping; tag /
collection diffs applied via `set` / `deleteMany` + `create`.

`deleteItem(id)` — ownership check, then `prisma.item.delete`; `ItemCollection` /
`ItemTag` rows cascade (`onDelete: Cascade` in schema). `revalidatePath` after.

### The knowledge that *is* type-specific, and where it goes

| Type-specific fact | Lives in | Not in |
|---|---|---|
| Which editor widget (code textarea vs markdown vs URL field vs dropzone) | `TypeContentField` + `fields/*` components | route, action |
| "snippet & command show a language dropdown" | `TextContentField` (prop) | action, schema |
| "note renders a markdown preview" | `TextContentField` (prop) | — |
| "link body must be a valid URL" | `lib/validations/item.ts` discriminated union (shared by action + form) | hard-coded in action |
| "file/image require fileUrl + fileName + fileSize" | same Zod union | — |
| Icon + accent color per type | data (`ItemType.icon` / `.color`) via `ItemTypeIcon` | any code table |
| Pro gating (`file`, `image`) | `PRO_TYPE_NAMES` set (already in `SidebarTypesNav`); enforce in `createItem` later when `isPro` is honored | scattered checks |
| Canonical ordering | `SYSTEM_TYPE_ORDER` in `lib/db/item-types.ts` (one copy) | 3 copies (today) |

### Validation module

`src/lib/validations/item.ts`:

```ts
const baseItem = z.object({
  itemTypeId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  collectionIds: z.array(z.string()).default([]),
});

const textContent = z.object({ kind: z.literal("text"), body: z.string().min(1, "Content is required"), language: z.string().optional() });
const urlContent  = z.object({ kind: z.literal("url"),  url: z.string().url("Enter a valid URL") });
const fileContent = z.object({ kind: z.literal("file"), fileUrl: z.string().url(), fileName: z.string().min(1), fileSize: z.number().int().positive() });

export const createItemSchema = baseItem.extend({ content: z.discriminatedUnion("kind", [textContent, urlContent, fileContent]) });
export const updateItemSchema = createItemSchema.partial({ content: true }).extend({ id: z.string().min(1) });
```

The client form picks which `content.kind` to submit from `CONTENT_KIND[type.name]`.

---

## 5. Data fetching (`src/lib/db/items.ts` additions)

All called **directly from server components**, matching `RecentItems.tsx`.

| Function | Signature | Used by |
|---|---|---|
| `getItemsByType` | `(typeName: string, opts?: { limit?: number; cursor?: string }) => Promise<ItemSummary[]>` | `/items/[type]/page.tsx` |
| `getItemById` | `(id: string) => Promise<ItemDetail \| null>` | future detail view / edit prefill |
| `getItemForEdit` | `(id: string, userId: string) => Promise<ItemDetail \| null>` | edit drawer (ownership-scoped) |

- Reuse the existing `toItemSummary` mapper and `ItemSummary` shape (id, title,
  description, isFavorite, isPinned, updatedAt, tags, type).
- `ItemDetail` extends `ItemSummary` with the raw content fields (`content`,
  `language`, `url`, `fileUrl`, `fileName`, `fileSize`, `description`,
  `collectionIds`) needed to populate the edit form.
- Keep `getDemoUserId()` scoping for the **list** query for now (consistent with
  the rest of the dashboard, which is not yet session-scoped); actions use the
  real `auth()` session because they mutate. Leave a `TODO` to switch the
  queries when auth-on-dashboard lands.
- No `revalidateTag`/`unstable_cache` yet — the codebase doesn't use it; rely on
  `revalidatePath` from the actions.

---

## 6. Component responsibilities

| Component | `'use client'`? | Responsibility | Talks to |
|---|---|---|---|
| `app/items/[type]/page.tsx` | server | Resolve slug → type, `notFound()` on miss, fetch items, render `ItemListView` | `lib/db/item-types`, `lib/db/items` |
| `ItemListView` | server | Section header (type label, item count, `NewItemButton`), renders `ItemGrid` or empty state | — |
| `ItemGrid` | server | `items.map(<ItemRow>)` — reuses the dashboard `ItemRow` unchanged | — |
| `ItemRow` (existing) | server | One item; type tile + accent from `item.type.color`; pin/star/tags/date | — |
| `NewItemButton` | client | Button that opens `ItemDrawer` in "create" mode with `defaultTypeId` = current type | — |
| `ItemDrawer` | client | shadcn `sheet`; holds `ItemForm`; closes on `state.success`; the "quick-access drawer" from the spec | — |
| `ItemForm` | client | `useActionState(createItem \| updateItem)`; renders shared fields (title, description, `ItemTagsField`, `ItemCollectionsField`) + `TypeContentField`; toast on result; hidden `itemTypeId` / `id` | `actions/items` |
| `TypeContentField` | client | `switch (CONTENT_KIND[typeName])` → `TextContentField` / `LinkContentField` / `FileContentField`. The **only** place the 7→3 mapping is applied in the UI | — |
| `TextContentField` | client | Textarea for snippet/prompt/note/command; `language` `<select>` when `showLanguage`; markdown preview toggle when `markdown` | — |
| `LinkContentField` | client | URL `<input type="url">`, inline validity hint | — |
| `FileContentField` | client | Dropzone → `POST /api/items/upload` with progress → sets hidden `fileUrl`/`fileName`/`fileSize`; accept filter (`image/*` for image type) | `api/items/upload` |
| `ItemTagsField` | client | Chip input; emits `tags[]` | — |
| `ItemCollectionsField` | client | Multi-select of the user's collections; emits `collectionIds[]` | (collections passed in as props from a server parent) |
| `api/items/upload/route.ts` | — (route handler) | Multipart receive → stream/presign to Cloudflare R2 → `{ fileUrl, fileName, fileSize }`. Exists because `coding-standards.md` sends file uploads with progress to an API route, not a Server Action. Row persistence still goes through `createItem`. | R2 |

---

## 7. Request flow summary

**Create (text type):**
`NewItemButton` → `ItemDrawer` opens → `ItemForm` (`TypeContentField` → `TextContentField`) →
submit → `createItem` action (`auth()` → `createItemSchema` → `prisma.item.create` → `revalidatePath`) →
`{ success:true }` → drawer closes, toast, list re-renders.

**Create (file/image type):**
`FileContentField` uploads bytes to `POST /api/items/upload` (progress bar) → gets `{ fileUrl, fileName, fileSize }` →
those ride along in the same form submit → `createItem` writes the row with `contentType:"file"`.

**Update:** same form, `updateItem(id,…)` — ownership re-check before write.

**Delete:** `deleteItem(id)` from a row/detail action → ownership check → `prisma.item.delete` → cascade → `revalidatePath`.

---

## 8. Decisions worth revisiting

- **Slug scheme.** Plural label (`/items/snippets`) matches the existing sidebar
  links. Alternative: singular machine name (`/items/snippet`). Picked plural
  only to avoid touching `SidebarTypesNav`.
- **Query user-scoping split.** Actions use `auth()`, list queries stay on
  `getDemoUserId()` short-term. Slightly inconsistent but matches the current
  half-migrated dashboard; unify when auth gates `/dashboard`.
- **`contentType` enum.** DB has only `text | file`; `link` is stored as `text` +
  `url` (see [`docs/item-types.md`](./item-types.md)). The action encodes this;
  no schema migration proposed.
- **Pro gating.** `file`/`image` creation should eventually check `user.isPro`,
  but `project-overview.md` §7 says all users get full access during dev — so the
  check is deferred, not built.
- **One upload route vs. presigned PUT.** Doc assumes a proxy route for progress
  tracking; a presigned-URL direct-to-R2 upload is the likely optimization later.
- **`toLabel` / `SYSTEM_TYPE_ORDER` dedupe.** This design introduces
  `lib/db/item-types.ts` as the single home; migrating the 3 existing copies
  (`items.ts`, `collections.ts`, `profile.ts`) is a small side cleanup, not
  required for CRUD to work.
