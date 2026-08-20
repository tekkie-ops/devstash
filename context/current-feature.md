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
