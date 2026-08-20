# Current Feature

<!-- Feature name and short description -->

**Dashboard UI Phase 2 — Sidebar** (@context/features/dashboard-phase-2-spec.md)

Replace the Phase 1 sidebar placeholder with the real, collapsible sidebar: item-type
navigation, favorite and recent collections, and a user area at the bottom. Data comes
from `@src/lib/mock-data.ts` (imported directly — no database yet).

## Status

<!-- Not Started | In Progress | Completed -->

In Progress

## Goals

<!-- Goals and requirements -->

- **Collapsible sidebar** on desktop — expanded (full labels) ↔ collapsed (icons only).
- **Toggle control** (drawer icon) to open/close it.
- **Item types** — one nav entry per type in `itemTypes`, using its lucide `icon`, plural
  `label` and `color`, linking to `/items/[type]` (e.g. `items/snippets`). The routes do
  not exist yet; links only for now.
- **Favorite collections** — collections where `isFavorite` is true.
- **Most recent collections** — collections sorted by `updatedAt`, newest first.
- **User avatar area** pinned to the bottom, from `currentUser` (`image` is `null`, so
  fall back to initials).
- **Mobile** — always an overlay drawer rather than an inline column.

## Notes

<!-- Any extra notes -->

- Current sidebar is [Sidebar.tsx](src/components/dashboard/Sidebar.tsx), a placeholder
  `<h2>` that is `hidden` below `md`. It is rendered from
  [layout.tsx](src/app/dashboard/layout.tsx) alongside `TopBar`.
- Phase 1 deferred the sidebar-collapse toggle to this phase.
- The main area stays as-is — recent collections, pinned items, recent items and stats
  cards are Phase 3 (@context/features/dashboard-phase-3-spec.md).
- Mock data holds relationships on the item (`typeId` / `collectionIds`) with no helper
  functions, so any counts or grouping are derived in the component.
- Decide whether to use ShadCN's `sidebar` component (pulls in `sheet`, `tooltip`,
  `separator`, `skeleton` and a cookie-backed provider) or hand-roll a smaller one on
  `sheet`. Worth confirming before implementing.

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-08-19: Initial Next.js + Tailwind CSS v4 project setup (`aaf1da7`), pushed to `origin/master`.
- 2026-08-20: Added dashboard UI screenshots as a design reference and linked them from the UI/UX section of `project-overview.md` (`9701c69`).
- 2026-08-20: Added `src/lib/mock-data.ts` — single source of truth for dashboard data until the database is in place: current user, seven system item types, six collections, twenty items. Relationships held on the item via `typeId` / `collectionIds`, no helper functions (`f53ab9f`). Build passed; both commits pushed to `origin/master`.
- 2026-08-20: Added the three dashboard UI phase specs under `context/features/` (`7b00d74`).
- 2026-08-20: Completed Dashboard UI Phase 1 (@context/features/dashboard-phase-1-spec.md) (`ab3738a`). Initialized ShadCN with the Nova preset (`radix-nova`, Lucide, Geist, neutral base — the CLI now uses named presets instead of `--base-color`) and added the `button` and `input` components. Added the `/dashboard` route with a shell layout: placeholder sidebar, display-only top bar (search + New Item), and a scrollable main area. Dark mode is a hardcoded `dark` class plus `color-scheme: dark`, not `next-themes`. Geist wired to `--font-sans` / `--font-mono`, which the preset expects but does not define. No `tailwind.config.ts` — v4 CSS config left intact. Deferred as out of spec: the "New Collection" button, the sidebar-collapse toggle, and redirecting `/` to `/dashboard`. Build and lint passed; verified in the browser.
