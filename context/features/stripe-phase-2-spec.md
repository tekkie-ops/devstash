# Stripe Integration — Phase 2: Integration & UI

## Overview

Build on Phase 1's foundation to deliver a working, end-to-end Pro
subscription flow: Checkout + Billing Portal Server Actions, the Stripe
webhook that keeps `User.isPro` in sync, enforcement of the free-tier
limits, and the Settings page billing UI. This phase needs a real Stripe
test-mode account and the Stripe CLI (`stripe listen`/`stripe trigger`) to
verify — it cannot be fully checked by `npm test` alone.

Full design/rationale: `docs/stripe-integration-plan.md` §4.3, §4.4, §4.6,
§6.5–6.7, §8, §9 (steps 5–9). Requires Phase 1 to be merged first.

## Requirements

### Checkout & Billing Portal (`src/actions/billing.ts`)

- `createCheckoutSession(interval: PlanInterval)`:
  - Auth gate → `isStripeConfigured()` check → reject if already Pro
  - Create (and persist) a Stripe Customer on first use, reusing
    `stripeCustomerId` on subsequent calls instead of creating duplicates
  - Set `client_reference_id`, `metadata.userId`, and
    `subscription_data.metadata.userId` redundantly, so the webhook has a
    fallback if the customer-id lookup ever misses
  - `success_url` → `/settings?checkout=success`, `cancel_url` →
    `/settings?checkout=canceled`; derive the origin from `headers()`, not a
    new base-URL env var (matches the pattern in `register/route.ts`)
- `createBillingPortalSession()`:
  - Auth gate → `isStripeConfigured()` check → reject if no
    `stripeCustomerId` → return the portal URL, `return_url` → `/settings`
- Follow the existing Server Action result shape:
  `{ success: true; ... } | { success: false; error: string }`, try/catch
  with a generic error message + `console.error` the real one

### Webhook (`src/app/api/webhooks/stripe/route.ts`)

- New API route (first webhook in the codebase) — no `auth()`, authenticity
  comes from the Stripe signature header instead
- 503 if Stripe or `STRIPE_WEBHOOK_SECRET` isn't configured; 400 on a missing
  or invalid signature
- Read the raw body via `request.text()` for `stripe.webhooks.constructEvent`
  (Route Handlers don't auto-parse, so no extra config needed)
- Handle `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted` — all three funnel into one
  `syncSubscription(subscriptionId, customer)` helper that **re-fetches** the
  subscription from Stripe and derives `isPro` from its current status
  (idempotent, safe against out-of-order delivery — don't trust the event
  payload's status directly)
- Look up the user by `stripeCustomerId`; unhandled event types and
  unmatched customers are logged and ignored, not errored
- Return 500 on handler failure so Stripe retries; do not add IP rate
  limiting to this route

### Feature Gating

- `src/actions/items.ts`'s `createItem` — when `isFeatureGatingEnabled()`:
  - Re-read `isPro` from the DB directly (not `session.user.isPro` — the JWT
    claim can be stale; a mutation that counts against a limit should read
    fresh)
  - Non-Pro + type in `PRO_ONLY_ITEM_TYPES` → reject with `proTypeMessage()`
  - Non-Pro + `getItemCountForUser(userId) >= FREE_ITEM_LIMIT` → reject with
    `itemLimitMessage()`
  - Insert the check after Zod validation, before the existing file-URL check
- `src/app/api/collections/route.ts`'s `POST` — same shape using the
  already-`userId`-scoped `getCollectionStats` and
  `FREE_COLLECTION_LIMIT`/`collectionLimitMessage()`; 403 on rejection
- With `FEATURE_GATING_ENABLED` unset/false (the default), both checks must
  be a complete no-op — current "everyone gets full access" behavior must
  not regress

### Settings UI

- `src/lib/db/billing.ts`'s `getBillingAccount` (from Phase 1) feeds a new
  Billing `Card` on `/settings`, placed between Editor preferences and
  Change password
- New `src/components/settings/BillingSection.tsx` (client):
  - Free: shows plan blurb + "Upgrade — $8/mo" / "Upgrade — $72/yr" buttons
    calling `createCheckoutSession`, redirecting via `window.location.href`
    on success, toasting the error otherwise
  - Pro: shows plan blurb + "Manage subscription" calling
    `createBillingPortalSession`
  - Disable buttons while a redirect is pending
- `/settings` reads a `?checkout=success|canceled` search param (via
  `PageProps<"/settings">`, same pattern as `params` elsewhere) and shows a
  confirmation banner on success, mirroring `/sign-in`'s existing
  `verified=1`/`reset=1` banner convention

### Stripe Dashboard Setup (prerequisite for manual testing)

- Create the "DevStash Pro" Product with two recurring Prices ($8/mo,
  $72/yr); copy their ids into `STRIPE_PRICE_ID_MONTHLY` /
  `STRIPE_PRICE_ID_YEARLY`
- Copy the test-mode Secret/Publishable keys into `.env`
- Local webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  → put its printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`
- Enable the Billing Portal in the Stripe Dashboard (Settings → Billing) —
  `createBillingPortalSession` fails at the API level without this
- Do the full walkthrough in **test mode** before ever touching live keys

## Unit Tests (Vitest — `src/actions/**`)

- `src/actions/billing.test.ts` (`vi.mock` on `@/auth`, `@/lib/prisma`,
  `@/lib/stripe`):
  - `createCheckoutSession` — unauthenticated, Stripe unconfigured,
    already-Pro, new customer (creates + persists `stripeCustomerId`),
    existing customer (reused, no second `customers.create`), SDK throw →
    generic error
  - `createBillingPortalSession` — unauthenticated, no `stripeCustomerId`,
    success
- `src/actions/items.test.ts` additions for `createItem`:
  - Gating on + free user at/over 50 items → rejected
  - Gating on + free user under limit → succeeds
  - Gating on + Pro user over 50 → succeeds
  - Gating on + `file`/`image` type + free user → rejected regardless of count
  - Gating off/unset → no check runs, current behavior unchanged
- Collection limit check: cover via `plan-limits.test.ts` (Phase 1) plus, if
  in scope, a new `src/app/api/collections/route.test.ts` — confirm whether
  this project wants its first API-route test before adding one

## Manual / Browser Testing (requires Stripe CLI + test-mode Stripe account)

This project does not unit-test components, routes with no pure logic, or
webhooks — these steps are required, not optional, for this phase:

1. **Webhook forwarding** — `stripe listen --forward-to
   localhost:3000/api/webhooks/stripe`, then:
   - `stripe trigger checkout.session.completed` → `User.isPro` → true,
     `stripeSubscriptionId` populated (verify via Neon MCP against
     `development`)
   - `stripe trigger customer.subscription.updated` with `status=past_due` →
     `isPro` → false
   - `stripe trigger customer.subscription.deleted` → `isPro` → false,
     `stripeSubscriptionId` cleared
   - Forged/invalid signature → 400, no DB write
   - Duplicate delivery of the same event → idempotent, same end state
2. **Real checkout**, both intervals, test card `4242 4242 4242 4242`:
   `/settings` → Upgrade → Stripe Checkout → `?checkout=success` banner →
   session reflects Pro after the next request. Cancel mid-checkout →
   `?checkout=canceled`, `isPro` unchanged.
3. **Billing Portal** — Pro user → "Manage subscription" → real portal loads
   → cancel from there → webhook flips `isPro` false
4. **Gating**, with `FEATURE_GATING_ENABLED=true` locally:
   - Free user at 50 items → 51st blocked; Pro user unaffected
   - Free user at 3 collections → 4th blocked; Pro user unaffected
   - Free user attempting `file`/`image` → blocked regardless of count
   - Confirm unset/`"false"` fully restores today's behavior
5. `npm test`, `npm run build`, `npm run lint` all pass

## Notes

- Optional follow-ups flagged in the plan (§6.8) but not required for a
  working flow — check with the user before building:
  - Client-side disabling of the file/image type picker for free users once
    gating is on (server check is already authoritative)
  - Wiring the homepage pricing CTA to `createCheckoutSession` for
    already-signed-in visitors
