# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Lay the foundation for DevStash Pro billing: the Stripe client, free-tier plan
limits, session sync for `isPro`, and the read-side DB helpers gating will
need — with no webhooks, no checkout flow, and no UI yet. Everything in this
phase is either pure logic or a no-op addition, so it should build, lint, and
pass tests with zero behavior change to the running app.

Full design/rationale: `docs/stripe-integration-plan.md` §4.1, §4.2, §4.5,
§4.6, §5.1, §6.1–6.4, §9 (steps 1–4).

## Requirements

- Install `stripe` (confirm current major via `npm view stripe version` first
  — plan assumed `^19`, re-verify before installing)
- Add to `.env.example`: a comment header above the existing five `STRIPE_*`
  vars (they currently have none) explaining what each is for and that
  checkout/webhooks are disabled when `STRIPE_SECRET_KEY` is unset, plus a new
  `FEATURE_GATING_ENABLED="false"` flag
- Create `src/lib/stripe.ts`:
  - `isStripeConfigured()` — true when `STRIPE_SECRET_KEY` is set
  - `stripeClient()` — lazy singleton, same pattern as `src/lib/r2.ts`
  - `PLAN_INTERVALS` / `PlanInterval` ("monthly" | "yearly")
  - `priceIdFor(interval)` — reads `STRIPE_PRICE_ID_MONTHLY` /
    `STRIPE_PRICE_ID_YEARLY`, throws if unset
  - `isActiveSubscriptionStatus(status)` — true for `active`/`trialing` only
    (`past_due` does NOT count as Pro)
- Create `src/lib/plan-limits.ts`:
  - `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3` (from
    `project-overview.md` §7)
  - `PRO_ONLY_ITEM_TYPES` — reuse the existing `FILE_ITEM_TYPES` constant from
    `src/lib/validations/items.ts`, don't duplicate the list
  - `isFeatureGatingEnabled()` — reads `FEATURE_GATING_ENABLED === "true"`,
    same shape as the existing `isEmailVerificationEnabled()`
  - `itemLimitMessage()`, `collectionLimitMessage()`, `proTypeMessage()` —
    user-facing strings for Phase 2's gate checks
- Session sync so a webhook-driven `isPro` change (Phase 2) reaches the
  session without depending on `trigger === "update"`:
  - `src/types/next-auth.d.ts` — add `isPro: boolean` to `Session.user` and
    `isPro?: boolean` to the `JWT` augmentation
  - `src/auth.ts` — `jwt` callback re-reads `isPro` from the DB via
    `token.id` on every call (not just initial sign-in); `session` callback
    copies it onto `session.user.isPro`
  - Accept the added cost: one extra `prisma.user.findUnique` per JWT
    validation (i.e. most authenticated requests) — matches the tradeoff
    already accepted in the research notes
- Create `src/lib/db/billing.ts` — `getBillingAccount(userId)` returning
  `{ isPro, hasStripeCustomer }`, mirroring `src/lib/db/profile.ts`'s shape
- Add `getItemCountForUser(userId)` to `src/lib/db/items.ts` — a correctly
  `userId`-scoped item count for the free-tier gate. Do **not** reuse the
  existing demo-scoped `getItemStats()`

## Unit Tests (Vitest — `src/lib/**`)

- `src/lib/plan-limits.test.ts`:
  - `isFeatureGatingEnabled()` — true when `"true"`, false when unset/any
    other value
  - `itemLimitMessage()` / `collectionLimitMessage()` / `proTypeMessage()`
    return the expected strings
  - `PRO_ONLY_ITEM_TYPES` matches `FILE_ITEM_TYPES`
- `src/lib/stripe.ts` (pure functions only, no live Stripe calls):
  - `isActiveSubscriptionStatus` — `active`/`trialing` → true;
    `past_due`/`canceled`/`unpaid`/`incomplete_expired` → false
  - `priceIdFor` — throws when the relevant env var is unset

## Notes

- Nothing added in this phase is called from anywhere yet (no checkout
  action, no gate checks, no webhook) — it's safe to land and merge on its
  own with zero user-visible change.
- `FEATURE_GATING_ENABLED` defaults to `"false"`, matching
  `project-overview.md` §7's dev note that all users get full access during
  development regardless of `isPro`.
- Phase 2 (checkout/portal actions, the webhook route, gate enforcement, and
  the Settings billing UI) needs real Stripe test-mode credentials and the
  Stripe CLI to verify — none of that is required for this phase.

## Testing

1. `npm test` — new `plan-limits`/`stripe` unit tests pass, existing suite
   unaffected
2. `npm run build` and `npm run lint` pass
3. Confirm the app still runs and behaves identically signed in as
   `demo@devstash.io` (no visible change expected)
