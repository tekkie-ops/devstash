# Current Feature

Seed Data — create a `prisma/seed.ts` script to populate the database with sample data for development and demos (demo user, all seven system item types, five collections with items).

## Status

Completed

## Goals

- Demo `User`: email `demo@devstash.io`, name `Demo User`, password `12345678` hashed with `bcryptjs` (12 rounds), `isPro: false`, `emailVerified` set to the current date
- All seven system `ItemType`s (snippet, prompt, command, note, file, image, link) with their spec'd icon/color, `isSystem: true`
- Five `Collection`s with items, per the spec:
  - React Patterns — 3 TypeScript snippets (hooks, component patterns, utility functions)
  - AI Workflows — 3 prompts (code review, doc generation, refactoring assistance)
  - DevOps — 1 snippet, 1 command, 2 links (real documentation URLs)
  - Terminal Commands — 4 commands (git, docker, process management, package manager)
  - Design Resources — 4 links (real URLs: CSS/Tailwind references, component libraries, design systems, icon libraries)

## Notes

- Reference spec: @context/features/seed-spec.md
- Builds on the schema from the completed Prisma + Neon setup (@context/features/database-spec.md) — see its Implementation decisions below and the 2026-08-21 history entry.
- Two Neon branches: a development branch (`DATABASE_URL`) and a production branch. Seeding should target the development branch.

### Implementation decisions

- `bcryptjs` 3.0.3 ships its own types, so no `@types/bcryptjs` devDependency was needed (installed then removed once confirmed).
- `prisma/seed.ts` reuses the `src/lib/prisma.ts` singleton (same pattern as `scripts/test-db.ts`), not a standalone client.
- Prisma 7 moved seed configuration out of `package.json`'s `prisma.seed` field into `prisma.config.ts`'s `migrations.seed`; set it to `tsx prisma/seed.ts` and added `npm run db:seed` → `prisma db seed`.
- `ItemType` has a `@@unique([userId, name])` with `userId` nullable — Prisma's generated compound-unique `where` input doesn't cleanly accept `null` for lookups, so system types are found with `findFirst({ where: { userId: null, name } })` + `create` instead of `upsert`.
- All seeded items use `contentType: "text"` since the spec only calls for snippet/prompt/command/link items (no file/image).
- The seed is idempotent for `User` (upsert by email) and system `ItemType`s (find-or-create), but **not** for collections/items — `createCollection` always creates new rows, so re-running the script duplicates collections and items. Worth revisiting if the seed needs to run repeatedly (e.g. after `prisma migrate reset`).

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-08-21: Completed Prisma + Neon PostgreSQL Setup (@context/features/database-spec.md) (`eec9de3`). Prisma 7.9.1 schema (`prisma/schema.prisma`) covering `User`, `Account`, `Session`, `VerificationToken`, `ItemType`, `Item`, `Collection`, `ItemCollection`, `Tag`, `ItemTag` — mirrors the `project-overview.md` draft plus `VerificationToken` (required by NextAuth, not in the draft) and `@@index` on every foreign key. Uses Neon's recommended `@prisma/adapter-neon` (WebSocket driver): `src/lib/prisma.ts` is a dev-mode singleton on the pooled `DATABASE_URL`, while `prisma.config.ts` points CLI/migration commands at a direct `DATABASE_URL_UNPOOLED` (schema's `datasource` has no `url`). First migration (`prisma/migrations/20260821152535_init`) applied and confirmed in sync via `prisma migrate status`. Added `scripts/test-db.ts` (`npm run db:test`) as a connection smoke test. Infra-only — `src/lib/mock-data.ts` still powers the dashboard; wiring components to the database is a separate future feature. Two things worth knowing: Prisma 7 forced `"type": "module"` into `package.json` and dropped its bundled Rust query engine (client output now generated to gitignored `src/generated/prisma` via a `postinstall: prisma generate` script); and `DATABASE_URL_UNPOOLED` was derived from the given pooled connection string by dropping `-pooler` from the hostname (Neon's standard convention), confirmed correct when the migration ran successfully. Build and lint passed.

- 2026-08-19: Initial Next.js + Tailwind CSS v4 project setup (`aaf1da7`), pushed to `origin/master`.
- 2026-08-20: Added dashboard UI screenshots as a design reference and linked them from the UI/UX section of `project-overview.md` (`9701c69`).
- 2026-08-20: Added `src/lib/mock-data.ts` — single source of truth for dashboard data until the database is in place: current user, seven system item types, six collections, twenty items. Relationships held on the item via `typeId` / `collectionIds`, no helper functions (`f53ab9f`). Build passed; both commits pushed to `origin/master`.
- 2026-08-20: Added the three dashboard UI phase specs under `context/features/` (`7b00d74`).
- 2026-08-20: Completed Dashboard UI Phase 1 (@context/features/dashboard-phase-1-spec.md) (`ab3738a`). Initialized ShadCN with the Nova preset (`radix-nova`, Lucide, Geist, neutral base — the CLI now uses named presets instead of `--base-color`) and added the `button` and `input` components. Added the `/dashboard` route with a shell layout: placeholder sidebar, display-only top bar (search + New Item), and a scrollable main area. Dark mode is a hardcoded `dark` class plus `color-scheme: dark`, not `next-themes`. Geist wired to `--font-sans` / `--font-mono`, which the preset expects but does not define. No `tailwind.config.ts` — v4 CSS config left intact. Deferred as out of spec: the "New Collection" button, the sidebar-collapse toggle, and redirecting `/` to `/dashboard`. Build and lint passed; verified in the browser.
- 2026-08-20: Completed Dashboard UI Phase 2 (@context/features/dashboard-phase-2-spec.md) (`2edd188`). Replaced the placeholder sidebar with ShadCN's `sidebar` (`collapsible="icon"`), which also pulled in `avatar`, `sheet`, `tooltip`, `separator` and `skeleton`. `Sidebar.tsx` stays a server component: brand header, a Types group (all seven types, lucide icon in the type's own color, item-count badge, linking to `/items/[label]`), then Favorites and Recent Collections groups linking to `/collections/[id]` — none of those routes exist yet. `SidebarUser.tsx` is the footer (initials fallback since `currentUser.image` is null, display-only settings gear). `src/lib/icons.ts` maps the mock data's `icon` string to its lucide component. `SidebarProvider` / `SidebarInset` in the dashboard layout, wrapped in `TooltipProvider` for the collapsed-mode tooltips; `SidebarTrigger` added to the top bar. Below 768px the sidebar becomes a Sheet drawer automatically; state persists in a cookie and ⌘B/Ctrl+B toggles. Three decisions to revisit: type icon colors use an inline `style` (a data-driven hex — the no-inline-styles rule would otherwise force a hardcoded hex→class table that stops tracking the source of truth); Recent excludes favorites so a collection never appears twice; and ShadCN's generated `use-mobile` hook was rewritten onto `useSyncExternalStore` because it set state inside an effect and failed `react-hooks/set-state-in-effect`. Deferred as out of spec: the "New Collection" button and the collapsible Types/Collections section chevrons in the screenshot. Build and lint passed; verified in the browser.
- 2026-08-20: Completed Dashboard UI Phase 3 (@context/features/dashboard-phase-3-spec.md) (`671ed3c`). The dashboard main area, all server components, each section querying `mock-data` itself the way `Sidebar.tsx` does. `StatsCards.tsx` (items, collections, favorite items, favorite collections), `RecentCollections.tsx` + `CollectionCard.tsx` (six most recently updated, card links to `/collections/[id]`, left accent = dominant item type, footer row of the type icons the collection contains), `PinnedItems.tsx` and `RecentItems.tsx` sharing `ItemRow.tsx` (type tile, title with pin/star, description, tag badges, date). `src/lib/dashboard.ts` holds the shared derivations: type lookup, items in a collection, a collection's distinct types ordered by frequency, a `byNewest` comparator, and a UTC-pinned `Jan 15` formatter (UTC so server and client render the same string). Added ShadCN `card` and `badge`. Three decisions to revisit: item rows are not clickable — items open in the quick-access drawer, which is a later feature, and `/items/[id]` would collide with Phase 2's `/items/[label]` type routes; type colors again use inline `style` for the same data-driven-hex reason as Phase 2; and Recent Collections here includes favorites (the sidebar excludes them to avoid double-listing) since the spec asks for recent collections and the screenshot shows all six. "View all" points at `/collections`, which does not exist yet. Note the dark `--card` token sits lighter than the background, so cards read more raised than the near-black cards in the screenshot. Build and lint passed; dashboard verified server-rendering over the dev server.
