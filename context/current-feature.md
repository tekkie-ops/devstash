# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-08-19: Initial Next.js + Tailwind CSS v4 project setup (`aaf1da7`), pushed to `origin/master`.
- 2026-08-20: Added dashboard UI screenshots as a design reference and linked them from the UI/UX section of `project-overview.md` (`9701c69`).
- 2026-08-20: Added `src/lib/mock-data.ts` — single source of truth for dashboard data until the database is in place: current user, seven system item types, six collections, twenty items. Relationships held on the item via `typeId` / `collectionIds`, no helper functions (`f53ab9f`). Build passed; both commits pushed to `origin/master`.
- 2026-08-20: Added the three dashboard UI phase specs under `context/features/` (`7b00d74`).
- 2026-08-20: Completed Dashboard UI Phase 1 (@context/features/dashboard-phase-1-spec.md) (`ab3738a`). Initialized ShadCN with the Nova preset (`radix-nova`, Lucide, Geist, neutral base — the CLI now uses named presets instead of `--base-color`) and added the `button` and `input` components. Added the `/dashboard` route with a shell layout: placeholder sidebar, display-only top bar (search + New Item), and a scrollable main area. Dark mode is a hardcoded `dark` class plus `color-scheme: dark`, not `next-themes`. Geist wired to `--font-sans` / `--font-mono`, which the preset expects but does not define. No `tailwind.config.ts` — v4 CSS config left intact. Deferred as out of spec: the "New Collection" button, the sidebar-collapse toggle, and redirecting `/` to `/dashboard`. Build and lint passed; verified in the browser.
- 2026-08-20: Completed Dashboard UI Phase 2 (@context/features/dashboard-phase-2-spec.md) (`2edd188`). Replaced the placeholder sidebar with ShadCN's `sidebar` (`collapsible="icon"`), which also pulled in `avatar`, `sheet`, `tooltip`, `separator` and `skeleton`. `Sidebar.tsx` stays a server component: brand header, a Types group (all seven types, lucide icon in the type's own color, item-count badge, linking to `/items/[label]`), then Favorites and Recent Collections groups linking to `/collections/[id]` — none of those routes exist yet. `SidebarUser.tsx` is the footer (initials fallback since `currentUser.image` is null, display-only settings gear). `src/lib/icons.ts` maps the mock data's `icon` string to its lucide component. `SidebarProvider` / `SidebarInset` in the dashboard layout, wrapped in `TooltipProvider` for the collapsed-mode tooltips; `SidebarTrigger` added to the top bar. Below 768px the sidebar becomes a Sheet drawer automatically; state persists in a cookie and ⌘B/Ctrl+B toggles. Three decisions to revisit: type icon colors use an inline `style` (a data-driven hex — the no-inline-styles rule would otherwise force a hardcoded hex→class table that stops tracking the source of truth); Recent excludes favorites so a collection never appears twice; and ShadCN's generated `use-mobile` hook was rewritten onto `useSyncExternalStore` because it set state inside an effect and failed `react-hooks/set-state-in-effect`. Deferred as out of spec: the "New Collection" button and the collapsible Types/Collections section chevrons in the screenshot. Build and lint passed; verified in the browser.
- 2026-08-20: Completed Dashboard UI Phase 3 (@context/features/dashboard-phase-3-spec.md) (`671ed3c`). The dashboard main area, all server components, each section querying `mock-data` itself the way `Sidebar.tsx` does. `StatsCards.tsx` (items, collections, favorite items, favorite collections), `RecentCollections.tsx` + `CollectionCard.tsx` (six most recently updated, card links to `/collections/[id]`, left accent = dominant item type, footer row of the type icons the collection contains), `PinnedItems.tsx` and `RecentItems.tsx` sharing `ItemRow.tsx` (type tile, title with pin/star, description, tag badges, date). `src/lib/dashboard.ts` holds the shared derivations: type lookup, items in a collection, a collection's distinct types ordered by frequency, a `byNewest` comparator, and a UTC-pinned `Jan 15` formatter (UTC so server and client render the same string). Added ShadCN `card` and `badge`. Three decisions to revisit: item rows are not clickable — items open in the quick-access drawer, which is a later feature, and `/items/[id]` would collide with Phase 2's `/items/[label]` type routes; type colors again use inline `style` for the same data-driven-hex reason as Phase 2; and Recent Collections here includes favorites (the sidebar excludes them to avoid double-listing) since the spec asks for recent collections and the screenshot shows all six. "View all" points at `/collections`, which does not exist yet. Note the dark `--card` token sits lighter than the background, so cards read more raised than the near-black cards in the screenshot. Build and lint passed; dashboard verified server-rendering over the dev server.
