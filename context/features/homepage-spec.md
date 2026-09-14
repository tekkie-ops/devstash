# Homepage

## Overview

Replace the placeholder `/` page with the real marketing homepage, built from the static prototype at `@prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Same sections, layout, copy, and visuals — ported to Next.js/React with Tailwind v4 + ShadCN instead of hand-written CSS, and real navigation instead of `#` placeholder links.

## Requirements

- Route: `src/app/page.tsx` (public, no auth gate — `src/proxy.ts`'s matcher is untouched).
- Sections, top to bottom, matching the mockup: Nav, Hero (chaos → arrow → dashboard preview), Features grid, AI section, Pricing, closing CTA, Footer.
- Server components by default; `'use client'` only where the mockup requires interactivity or browser APIs:
  - Chaos icon animation (`requestAnimationFrame`, mouse-repel) — client.
  - Navbar scroll-opacity effect — client.
  - Scroll-triggered fade-ins (`IntersectionObserver` on `.reveal` equivalents) — client.
  - Pricing monthly/yearly toggle — client.
  - Footer copyright year — client (or a server-rendered `new Date().getFullYear()` is fine since it needs no interactivity; prefer that over a client component).
- Everything else (nav shell, hero text, feature cards, AI section copy, pricing cards, CTA, footer links) stays server-rendered.
- Use Tailwind utility classes for layout/spacing/typography and the `@theme` tokens already in `src/app/globals.css` — no new hardcoded hex values except the item-type accent colors listed below, which follow the same inline-`style` pattern used elsewhere in the app (`ItemTypeIcon`, `ItemCard`, `CollectionCard`) since they're data-driven, not themeable.
- Use ShadCN `Button` for all CTAs/nav actions (ghost/outline/default variants as the mockup implies), matching existing usage elsewhere in the app. Plain `Link` (from `next/link`) for text/nav links, `<a href="#...">` only for same-page anchor scrolling (Features/Pricing nav links, footer Product links).
- Reuse the seven item-type colors from `project-overview.md` (`#3b82f6` snippet, `#8b5cf6` prompt, `#fde047` note, `#f97316` command, `#10b981` link, `#6b7280` file, `#ec4899` image) for the Features grid card accents and dashboard-preview mock, in place of the mockup's own separate placeholder palette — keeps the homepage visually consistent with the real app instead of introducing a second color system.
- Suggested component breakdown under `src/components/homepage/`: `Navbar`, `Hero`, `ChaosVisual` (client), `DashboardPreview`, `FeaturesSection`, `AiSection`, `PricingSection` (client, for the toggle), `ClosingCta`, `Footer`. Split further only if a file grows unwieldy — don't over-fragment simple static markup.
- Keep it DRY: factor repeated shapes (feature card, pricing feature list item, footer link column) into small local helper components or a `.map()` over a data array, rather than copy-pasting JSX per item — mirrors how `Sidebar`'s nav groups and `PricingSection`'s feature lists are already data-driven elsewhere in the mockup's own JS/HTML structure.

## Navigation targets (mockup used `#`/`href="#"` placeholders — wire these to real routes)

- Logo → `/`
- Nav "Features" / "Pricing" → same-page anchor scroll (`#features` / `#pricing`), unchanged from the mockup.
- Nav "Sign In" → `/sign-in`
- Nav "Get Started" (navbar + hero "Get Started Free" + closing CTA) → `/register`
- Hero "See Features" → `#features` anchor scroll, unchanged.
- Pricing "Free" card CTA ("Get Started") → `/register`
- Pricing "Pro" card CTA ("Upgrade to Pro") → `/register` (no Stripe checkout exists yet — Pro signup still goes through normal registration, per `project-overview.md`'s dev note that all users get full access during development)
- Footer "Features" / "Pricing" → same anchors as the nav.
- Footer "About" / "Blog" / "Privacy" / "Terms" → leave as inert `#` links; these pages don't exist and are out of scope.

If the visiting user already has a session (check via `auth()` in the server-rendered `Navbar`/`Hero`), swap "Sign In" for a "Dashboard" link and "Get Started" for "Go to Dashboard", both pointing at `/dashboard` — avoids sending an already-registered user back through sign-up.

## Out of scope

- Stripe/real billing — pricing CTAs go to `/register`, not a checkout flow.
- `/about`, `/blog`, `/privacy`, `/terms` pages.
- Redirecting `/` to `/dashboard` for authenticated users (they get updated CTAs instead, per above, but the homepage itself still renders).

## References

- `@prototypes/homepage/index.html`
- `@prototypes/homepage/styles.css`
- `@prototypes/homepage/script.js`
- `@context/features/homepage-mockup-spec.md`
- `@context/project-overview.md`
