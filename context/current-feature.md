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