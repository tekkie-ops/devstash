# Item Types

> Reference documentation for the 7 built-in ("system") item types in DevStash.
> Generated research — describes current state as of 2026-09-07.

## Source of truth

The prompt referenced `src/lib/constants.tsx`, which does **not** exist. Item-type
definitions are currently spread across three files, none of which is a single
canonical constant module:

| File | What it defines |
|---|---|
| [`prisma/seed.ts`](../prisma/seed.ts) (`SYSTEM_TYPES`) | Authoritative `name` / `icon` / `color` for the rows written to the DB. All 7 seeded with `isSystem: true`, `userId: null`. |
| [`src/lib/mock-data.ts`](../src/lib/mock-data.ts) (`itemTypes`) | Pre-database mock array. Adds the derived `label` (plural), `contentType`, and `isPro` flags. Still used by parts of the UI not yet migrated to Prisma. |
| [`src/lib/icons.ts`](../src/lib/icons.ts) (`ITEM_TYPE_ICONS`) | Maps each `icon` string to its `lucide-react` component. |
| [`prisma/schema.prisma`](../prisma/schema.prisma) (`ItemType`, `Item`, `ContentType`) | Storage model. |

DB rows on the `development` branch were verified against `seed.ts` — `name`,
`icon`, `color`, and `isSystem` all match.

---

## Per-type reference

| Type | Machine name | UI label | Icon (lucide) | Hex color | Swatch | Content kind | Tier |
|---|---|---|---|---|---|---|---|
| Snippet | `snippet` | Snippets | `Code` | `#3b82f6` | 🔵 blue | text | Free |
| Prompt | `prompt` | Prompts | `Sparkles` | `#8b5cf6` | 🟣 violet | text | Free |
| Note | `note` | Notes | `StickyNote` | `#fde047` | 🟡 yellow | text | Free |
| Command | `command` | Commands | `Terminal` | `#f97316` | 🟠 orange | text | Free |
| Link | `link` | Links | `Link` | `#10b981` | 🟢 emerald | url | Free |
| File | `file` | Files | `File` | `#6b7280` | ⚪ gray | file | **Pro** |
| Image | `image` | Images | `Image` | `#ec4899` | 🌸 pink | file | **Pro** |

> `label` is derived at runtime as `name[0].toUpperCase() + name.slice(1) + "s"`
> (`toLabel()` in `src/lib/db/items.ts` and `src/lib/db/collections.ts`), not stored.

> Tier gating is defined in data (`isPro` in `mock-data.ts`) and shown as a "PRO"
> badge in the sidebar (`PRO_TYPE_NAMES = {"file", "image"}` in
> `src/components/dashboard/SidebarTypesNav.tsx`). Per `project-overview.md` §7,
> **all users currently get full access regardless of `isPro`** during development.

---

### `snippet` — Snippets

- **Purpose:** Reusable blocks of code (hooks, patterns, boilerplate). The
  flagship type; most seeded items are snippets.
- **Content kind:** text → stored inline in `Item.content`.
- **Key fields used:** `title`, `content`, `language` (syntax-highlight hint, e.g.
  `typescript`, `python`, `dockerfile`), `description`, `tags`.
- **Icon / color:** `Code` / `#3b82f6`.

### `prompt` — Prompts

- **Purpose:** Saved AI prompts and system messages (code review, doc generation,
  refactoring assistants, etc.).
- **Content kind:** text → `Item.content`.
- **Key fields used:** `title`, `content`, `description`, `tags`. `language` is
  left null in seed data.
- **Icon / color:** `Sparkles` / `#8b5cf6`.

### `note` — Notes

- **Purpose:** Free-form Markdown notes — cheatsheets, step lists, tables (Big-O
  table, interactive-rebase steps, virtualenv cheatsheet).
- **Content kind:** text → `Item.content` (rendered via the Markdown editor).
- **Key fields used:** `title`, `content`, `description`, `tags`. No `language`.
- **Icon / color:** `StickyNote` / `#fde047`.

### `command` — Commands

- **Purpose:** Single shell/terminal commands to keep and re-run (git resets,
  `docker system prune`, port-kill one-liners).
- **Content kind:** text → `Item.content` (typically one line).
- **Key fields used:** `title`, `content`, `description`, `tags`, sometimes
  `language: "bash"`.
- **Icon / color:** `Terminal` / `#f97316`.

### `link` — Links

- **Purpose:** Bookmarked URLs — docs, reference repos, guides.
- **Content kind:** **url** → stored in `Item.url`; `Item.content` is null.
- **Key fields used:** `title`, `url`, `description`, `tags`.
- **Icon / color:** `Link` / `#10b981`.
- **Note:** `mock-data.ts` models this as its own `contentType: "url"`, but the
  Prisma `ContentType` enum has only `text | file`. In the DB, link items are
  stored with `contentType: "text"` and a populated `url` (see `seed.ts`
  `createCollection`, which hardcodes `contentType: "text"` for every item).

### `file` — Files  *(Pro)*

- **Purpose:** Uploaded documents (context files, `.md` specs, standards docs).
- **Content kind:** file → binary lives in Cloudflare R2; the row holds a
  reference.
- **Key fields used:** `fileUrl` (R2 URL), `fileName`, `fileSize` (bytes),
  `title`, `description`, `tags`. `content` is null.
- **Icon / color:** `File` / `#6b7280`.
- **Status:** 0 seeded items. R2 upload path not implemented yet.

### `image` — Images  *(Pro)*

- **Purpose:** Uploaded images — diagrams, screenshots, design exports.
- **Content kind:** file → R2, same as `file`.
- **Key fields used:** `fileUrl`, `fileName`, `fileSize`, `title`, `description`,
  `tags`. `content` is null.
- **Icon / color:** `Image` / `#ec4899`.
- **Status:** 0 seeded items. Rendered the same as `file` in the current UI (no
  thumbnail preview yet).

---

## Summary: text vs file vs URL

`project-overview.md` §3 defines three **content kinds** that map to storage:

| Content kind | Types | Stored in | Prisma `ContentType` | Notes |
|---|---|---|---|---|
| **text** | snippet, prompt, note, command | `Item.content` (`@db.Text`) | `text` | Inline. Markdown/code. `language` optional. |
| **url** | link | `Item.url` | `text` (no dedicated enum value) | Only the URL string is stored; no body. |
| **file** | file, image | Cloudflare R2, referenced by `Item.fileUrl` + `fileName` + `fileSize` | `file` | Pro tier. `content` is null. |

Mismatch worth knowing: the conceptual model has **3** content kinds
(text / url / file) and `mock-data.ts` encodes all 3 as `ContentType`, but the
**database enum has only 2** (`text`, `file`). `link` collapses into `text` at
the storage layer, distinguished only by having `url` set instead of `content`.

---

## Shared properties (all types)

Every item, regardless of type, is one `Item` row with:

| Field | Type | Purpose |
|---|---|---|
| `id` | `String` cuid | PK |
| `title` | `String` | Required display name |
| `contentType` | `ContentType` | `text` or `file` |
| `description` | `String?` | Short subtitle shown in item rows |
| `isFavorite` | `Boolean` (default false) | ⭐ starred; drives Favorites views & stat cards |
| `isPinned` | `Boolean` (default false) | 📌 pinned to top; drives the Pinned Items section |
| `userId` → `User` | FK, `onDelete: Cascade` | Owner |
| `itemTypeId` → `ItemType` | FK | The type |
| `collections` | `ItemCollection[]` | Many-to-many with `Collection` |
| `tags` | `ItemTag[]` → `Tag` | Many-to-many; `Tag.name` is globally unique |
| `createdAt` / `updatedAt` | `DateTime` | `updatedAt` drives all "Recent" ordering |
| Indexes | `@@index([userId])`, `@@index([itemTypeId])` | |

Type-specific fields (`content`, `url`, `fileUrl`, `fileName`, `fileSize`,
`language`) are all **nullable columns on the same `Item` table** — there is no
per-type table or subtype. Which ones are populated is determined by the type's
content kind, by convention, not by a DB constraint.

`ItemType` itself: `id`, `name`, `icon` (lucide name), `color` (hex string),
`isSystem` (true for all 7), `userId` (null for system types). Uniqueness is
`@@unique([userId, name])`. Custom user types are a planned post-launch Pro
feature — the `userId` column and `User.itemTypes` relation already exist for it.

---

## Display differences

All rendering is data-driven off `ItemType.icon` + `ItemType.color`; there is no
per-type component or `switch`. Colors arrive as hex strings, so they are applied
via inline `style` (a hardcoded hex→Tailwind-class table would drift from the
source of truth — see comments in `ItemTypeIcon.tsx`).

| Surface | Component | How type is shown |
|---|---|---|
| Sidebar "Types" nav | `SidebarTypesNav.tsx` | lucide icon tinted with `type.color`, plural `label`, per-type item-count badge. `file`/`image` also get an outline **PRO** badge. Links to `/items/{label-lowercased}` (route not built yet). |
| Item rows (Pinned / Recent) | `ItemRow.tsx` + `ItemTypeIcon.tsx` | `ItemTypeTile`: icon on a `color + "1a"` (≈10% alpha) rounded tile. Row has a 2px **left border** in `type.color`. Pin/star icons, description, tag badges, `updatedAt` date (UTC-formatted `Mon D`). Not clickable yet (drawer is a later feature). |
| Collection cards | `CollectionCard.tsx` (via `getRecentCollections`) | Card's dominant-type accent = the collection's most-frequent item type's color; footer shows a row of the distinct type icons present. |
| Stat cards | `StatsCards.tsx` | Type breakdown counts (also on `/profile` via `ProfileStats.tsx`). |

Icon resolution: `ITEM_TYPE_ICONS[type.icon]` in `src/lib/icons.ts`. If a type's
`icon` string isn't in that map, the icon renders as `null` (no crash). The map
currently covers exactly the 7 system icons: `Code`, `Sparkles`, `StickyNote`,
`Terminal`, `Link`, `File`, `Image`.

---

## Canonical ordering

Two independent hardcoded lists define the same display order (there is no
ordering column on `ItemType`, and `cuid()` ids aren't time-sortable):

- `SYSTEM_TYPE_ORDER` in `src/lib/db/items.ts`
- the array order of `itemTypes` in `src/lib/mock-data.ts`

Both are: **snippet → prompt → command → note → file → image → link**.

(Note `project-overview.md` §3's table lists them snippet, prompt, note, command,
link, file, image — a slightly different order. The code puts `command` before
`note`.)

---

## Current seed data (development branch, verified 2026-09-07)

| Type | Items |
|---|---|
| snippet | 4 |
| prompt | 3 |
| command | 5 |
| note | 0 |
| file | 0 |
| image | 0 |
| link | 6 |
| **Total** | **18** |

All 18 seeded items are `contentType: "text"` (including the 6 links, which carry
`url`). No seeded items are pinned; some are favorited. `note`, `file`, and
`image` have no seed coverage.
