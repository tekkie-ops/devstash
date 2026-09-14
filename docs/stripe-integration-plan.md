# Stripe Subscription Integration Plan

> Research/planning document — describes a **proposed** implementation, not yet built.
> Generated from `context/research/stripe-integration-research.md` on 2026-09-14.
> Scope: DevStash Pro, $8/mo monthly or $72/yr annual, via Stripe Checkout + Billing Portal + webhooks.

---

## 1. Current State Analysis

### 1.1 `User` model — already has the fields this needs

`prisma/schema.prisma:12-35` — no migration is required to start:

```prisma
model User {
  ...
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  ...
}
```

These three fields were added in the original schema draft and have shipped in every migration since `20260821152535_init`. They are currently unused by any app code (confirmed via `grep isPro`/`grep stripe` across `src/`) — `isPro` only appears in `src/lib/mock-data.ts` (pre-Prisma mock data, still used by parts of the UI not yet migrated) and in doc comments. **This is a green field**, not a refactor.

A same-day chore commit (`f31f37e`) already added the five Stripe env var placeholders to `.env.example`:

```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

None are populated in `.env` yet (not read for this research — only existence/naming checked) and the `stripe` npm package is **not installed** (`package.json` has no Stripe dependency).

### 1.2 NextAuth v5 configuration and session handling

Split-config pattern (`src/auth.config.ts` edge-safe, `src/auth.ts` full):

- `src/auth.ts:13-29` — JWT session strategy, `PrismaAdapter`, and two callbacks:
  ```ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  ```
  Today the JWT callback only ever runs the DB-free `if (user)` branch — `user` is only present on initial sign-in, so after that the token is never touched again. This is exactly the situation `context/research/stripe-integration-research.md`'s Notes section describes: a webhook-driven `isPro` change in the database would never reach an already-issued JWT without the "always sync from DB" workaround.
- `src/types/next-auth.d.ts` — module augmentation currently only adds `id` to `Session.user`. Will need `isPro` added here too (and to the `JWT` type, since the sync lives in the `jwt` callback).
- Every server-side consumer of the session (`auth()` from `@/auth`) reads `session.user.id` — see `src/actions/items.ts`, `src/actions/profile.ts`, `src/app/api/collections/route.ts`, `src/app/settings/page.tsx`, `src/app/profile/page.tsx`. None currently read `isPro`; all Pro-gating logic will need to either read `session.user.isPro` (once added) or re-query the DB.

### 1.3 How user data is accessed

Two patterns coexist, both already established:

- **Server components** call `auth()` directly, then pass `session.user.id` into `src/lib/db/*.ts` query functions (e.g. `src/app/settings/page.tsx:17-24`, `src/app/profile/page.tsx:18-29`).
- **Mutations** go through `src/actions/*.ts` Server Actions, each starting with the same auth gate:
  ```ts
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }
  ```
  (see `src/actions/items.ts`, `src/actions/profile.ts`, `src/actions/editor-preferences.ts`).

There is **one existing gap** worth knowing before wiring gating logic: several read functions in `src/lib/db/items.ts` — `getPinnedItems`, `getRecentItems`, `getItemsByTypeSlug`, `getItemTypesWithCounts`, `getItemStats` — still call the hardcoded `getDemoUserId()` (`src/lib/db/user.ts`) instead of taking an explicit `userId`, a documented placeholder left over from before auth existed (see the 2026-09-11 "Fix Item Authorization" history entry in `context/current-feature.md`). `src/lib/db/collections.ts`'s equivalents (`getCollectionStats`, `getRecentCollections`, etc.) were already migrated to explicit `userId` params in the 2026-09-12 Collection Create feature. **This plan does not fix the items-side gap** (it's a larger, separate dashboard-wiring feature) — instead it adds a new, narrowly-scoped, correctly-`userId`-scoped counting function for gating (§4.2), so Pro-limit checks are correct regardless of when that larger fix lands.

### 1.4 Existing subscription/payment code

None. `grep -ri stripe src/` returns nothing under `src/`. No billing UI, no webhook route, no plan-limit checks anywhere in the app.

---

## 2. Feature Gating Analysis

### 2.1 Free tier limits (from `context/project-overview.md` §7)

| Tier | Items | Collections | Types | AI |
|---|---|---|---|---|
| Free | 50 | 3 | All except `file`/`image` | None |
| Pro ($8/mo or $72/yr) | Unlimited | Unlimited | All 7 + custom (later) | Auto-tag, explain, prompt optimizer |

`project-overview.md` §7 also carries an explicit **dev note**:

> foundation for Pro gating should be built now, but during development **all users get full access** regardless of `isPro`.

This is a real, current constraint — not just documentation. It matches a pattern the codebase already uses for another feature-toggle: `EMAIL_VERIFICATION_ENABLED` (`src/lib/email-verification.ts`, checked via `isEmailVerificationEnabled()`), which defaults enabled but lets the requirement be switched off in an environment without the supporting infrastructure configured (Resend domain). §4.2 below proposes the same shape — a `FEATURE_GATING_ENABLED` env flag, defaulting to **off** — so this plan can ship real Stripe checkout/webhook/`isPro`-sync now without silently changing current dev-mode behavior, and gating flips on with one env var when the team is ready.

### 2.2 Where item/collection counts are checked today

Nowhere. `src/lib/db/items.ts`'s `createItem` and `src/lib/db/collections.ts`'s `createCollection` insert unconditionally; neither `src/actions/items.ts`'s `createItem` action nor `POST /api/collections` (`src/app/api/collections/route.ts`) does any count check before calling them. This is the exact insertion point for limit enforcement (§4.2, §5.5–5.6).

Existing count queries to reuse/model from:
- `getCollectionStats(userId)` (`src/lib/db/collections.ts:238-248`) — already correctly `userId`-scoped, returns `{ total, favorites }`.
- `getItemStats()` (`src/lib/db/items.ts:605-621`) — demo-scoped (see §1.3); **do not reuse directly** for gating.

### 2.3 Pro-only features and their current state

| Feature | Status | Where |
|---|---|---|
| `file` / `image` item types | **Fully built, not gated.** Any signed-in user can create/upload them today. | `src/lib/validations/items.ts` (`FILE_ITEM_TYPES`), `src/app/api/upload/route.ts`, `CreateItemDialog.tsx` |
| PRO badge (cosmetic only) | Sidebar shows an outline "PRO" badge next to Files/Images, but it's decorative — no enforcement. | `src/components/dashboard/SidebarTypesNav.tsx:16-17,43` — `const PRO_TYPE_NAMES = new Set(["file", "image"])` |
| Custom item types | Not built (schema supports it — `ItemType.userId` — but no UI/action exists). Out of scope for this plan. | — |
| AI auto-tag / summaries / explain / optimizer | Not built at all. Out of scope for this plan. | — |
| Export (JSON/ZIP) | Not built. Out of scope for this plan. | — |

So the only feature this plan needs to actually gate (beyond item/collection counts) is **file/image item creation**, using the already-existing `FILE_ITEM_TYPES` constant as the source of truth for "which types are Pro-only" — no new type list needed.

### 2.4 Settings page structure

`src/app/settings/page.tsx` (protected via `src/proxy.ts`'s `/settings/:path*` matcher) is an async server component rendering a fixed stack of shadcn `Card`s:

1. Editor preferences (`EditorPreferencesForm`, auto-saves via a context provider — no save button)
2. Change password (conditional: only if `getProfileAccount(userId).hasPassword`)
3. Danger zone — Delete account

Each card follows the same shape: `CardHeader` (title + description) + `CardContent` (the form/control). A new **Billing** card fits this pattern directly — see §4.6.

---

## 3. API & Webhook Patterns

### 3.1 Server Actions vs. API routes — the project's existing rule

`docs/item-crud-architecture.md:40-44`, echoing `context/coding-standards.md`:

> Server Actions for form submissions and simple mutations. API routes only for webhooks, file uploads with progress, long-running ops, specific status/headers, or future mobile/CLI clients.

The codebase has followed this strictly: every item/profile/editor-preference mutation is a Server Action; the *only* API routes that exist are for things Server Actions structurally can't do — NextAuth's own routes, three auth routes needing specific HTTP status codes + IP rate limiting (`register`, `forgot-password`, `reset-password`, `resend-verification`), file upload (needs multipart + progress), item download (needs to stream a `Content-Disposition` response), and — the closest precedent — nothing webhook-shaped yet, but the rule explicitly calls webhooks out as the other sanctioned case.

**Implication for this plan:** the Stripe **webhook** must be an API route (`POST /api/webhooks/stripe`) — no other option, Stripe calls it directly with a signature header, there's no session. Everything else (starting checkout, opening the billing portal) is a normal signed-in mutation with no special HTTP requirements, so it follows the Server Action convention like `src/actions/items.ts`.

### 3.2 Server Action error-handling pattern to follow

Every existing action (`src/actions/items.ts`, `src/actions/profile.ts`) follows the same shape:

```ts
"use server";

export async function someAction(...): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  const parsed = someSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await someDbCall(session.user.id, parsed.data);
    if (!result) {
      return { success: false, error: "Not found" };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("someAction failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

Result types are discriminated unions: `{ success: true; data: T } | { success: false; error: string }`. The new billing actions (§4.3) follow this exactly.

### 3.3 API route pattern to follow

`src/app/api/collections/route.ts` and `src/app/api/upload/route.ts` both: `auth()` → 401 if missing → parse/validate body → 400 on invalid → call a `src/lib/db/*.ts` function → try/catch → 500 with a generic message, `console.error` the real one. `src/app/api/upload/route.ts` additionally 503s when its external dependency (R2) isn't configured — the same shape this plan uses for "Stripe isn't configured" (§4.4, §5.4).

A webhook route is structurally different (no `auth()`, no user-supplied body to validate with Zod — the body's authenticity *is* the signature check), so §4.4 introduces that as a new, one-off pattern rather than forcing it into the existing shape.

### 3.4 Environment variable pattern

`.env.example` groups vars by integration with a comment header explaining what it's for and what happens when it's unset (see the R2 block: *"Uploads are disabled (503) if R2_BUCKET_NAME is unset"*). External clients are lazy singletons reading `process.env` directly at first use, never at module load time for anything that could be legitimately absent in dev (`src/lib/r2.ts`, `src/lib/rate-limit.ts`). This plan's `src/lib/stripe.ts` (§4.1) follows the same lazy-singleton shape as `src/lib/r2.ts`.

The project has also established, twice now (Email Verification's Resend sender, Auth Register's callback URL), a preference for **deriving URLs at request time instead of adding a base-URL env var** — e.g. `register/route.ts` builds its verification link from `new URL("/api/auth/verify-email", request.url)`. §4.3's checkout/portal actions follow the same approach using `headers()` instead of a new `NEXT_PUBLIC_APP_URL` var.

---

## 4. Proposed Architecture

### 4.1 `src/lib/stripe.ts` — Stripe client singleton

New file, modeled on `src/lib/r2.ts`'s lazy-client pattern:

```ts
import Stripe from "stripe";

/**
 * Lazy Stripe client singleton, mirroring src/lib/r2.ts's pattern. Empty when
 * unconfigured — callers should 503 (API routes) or return a friendly error
 * (Server Actions) rather than let the SDK throw on a missing key.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripeClient(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
    client = new Stripe(secretKey);
  }
  return client;
}

/** Billing-cycle keys used throughout the app instead of raw Stripe price ids. */
export const PLAN_INTERVALS = ["monthly", "yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export function priceIdFor(interval: PlanInterval): string {
  const id =
    interval === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;

  if (!id) {
    throw new Error(`Missing Stripe price id for interval "${interval}"`);
  }
  return id;
}

/**
 * Stripe subscription statuses that should be treated as "Pro" access. Trialing
 * counts as Pro (per Stripe's own recommendation); past_due deliberately does
 * NOT — see the webhook handler in src/app/api/webhooks/stripe/route.ts.
 */
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

export function isActiveSubscriptionStatus(
  status: Stripe.Subscription.Status,
): boolean {
  return ACTIVE_STATUSES.has(status);
}
```

Pin the version explicitly: `npm install stripe@^19` (confirmed current major via Context7 against the `stripe-node` docs on 2026-09-14 — **re-verify against `npmjs.com/package/stripe` before installing**, since a newer major may exist by the time this plan is implemented, same caution `project-overview.md` already flags for Prisma). No `apiVersion` pin in the constructor above — the installed SDK's default matches its own bundled type definitions, which is the safest choice absent a specific reason to pin an older version.

### 4.2 `src/lib/plan-limits.ts` — free-tier limits + the gating toggle

New file:

```ts
import { FILE_ITEM_TYPES } from "@/lib/validations/items";

/** See project-overview.md §7. */
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

/**
 * file/image are the only Pro-only item types today (project-overview.md §3).
 * Reuses the existing FILE_ITEM_TYPES constant as the single source of truth
 * rather than duplicating the list.
 */
export const PRO_ONLY_ITEM_TYPES: readonly string[] = FILE_ITEM_TYPES;

/**
 * Whether Pro limits/gating are actually enforced. Defaults OFF, matching
 * project-overview.md §7's explicit dev note ("during development all users
 * get full access regardless of isPro") — mirrors the existing
 * EMAIL_VERIFICATION_ENABLED toggle in src/lib/email-verification.ts. Flip
 * FEATURE_GATING_ENABLED="true" to turn on enforcement (e.g. for a staging/
 * launch environment) without changing any code.
 */
export function isFeatureGatingEnabled(): boolean {
  return process.env.FEATURE_GATING_ENABLED === "true";
}

export function itemLimitMessage(): string {
  return `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
}

export function collectionLimitMessage(): string {
  return `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
}

export function proTypeMessage(): string {
  return "Files and images are a Pro feature. Upgrade to Pro to upload them.";
}
```

Pure, dependency-free — fits the project's existing testing scope (`src/lib/**`, no mocks needed). See §7 for test cases.

### 4.3 `src/actions/billing.ts` — checkout + portal Server Actions

New file, following `src/actions/items.ts`'s exact result-type/auth-gate/try-catch shape:

```ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isStripeConfigured,
  priceIdFor,
  stripeClient,
  type PlanInterval,
} from "@/lib/stripe";

export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

/** Reads the request's own origin instead of adding a base-URL env var — the same approach `register/route.ts` uses for its verification link. */
async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Starts a Stripe Checkout session for the signed-in user to subscribe to
 * DevStash Pro. Creates (and persists) a Stripe Customer on first use so a
 * returning user reuses the same customer instead of accumulating duplicates.
 * The webhook (not this action) is the source of truth for isPro — this only
 * gets the user to Stripe's hosted page.
 */
export async function createCheckoutSession(
  interval: PlanInterval,
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, isPro: true },
  });

  if (!user) {
    return { success: false, error: "Account not found" };
  }

  if (user.isPro) {
    return { success: false, error: "You already have a Pro subscription" };
  }

  const stripe = stripeClient();
  const origin = await getOrigin();

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceIdFor(interval), quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=canceled`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Couldn't start checkout. Please try again." };
    }

    return { success: true, url: checkoutSession.url };
  } catch (error) {
    console.error("createCheckoutSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type PortalResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Opens Stripe's hosted Billing Portal so a Pro user can update payment
 * details, switch plans, or cancel — no custom cancel/upgrade UI needed.
 */
export async function createBillingPortalSession(): Promise<PortalResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const stripe = stripeClient();
  const origin = await getOrigin();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return { success: true, url: portalSession.url };
  } catch (error) {
    console.error("createBillingPortalSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

Note: `client_reference_id` **and** `metadata.userId` **and** `subscription_data.metadata.userId` are all set redundantly on purpose — the webhook (§4.4) primarily looks up the user by `stripeCustomerId` (always present, set above before Checkout is created), and falls back to `metadata.userId` only if that customer lookup somehow misses, so a metadata-stripping edge case in Stripe's own dashboard-triggered events doesn't strand a user's `isPro` flag.

### 4.4 `POST /api/webhooks/stripe` — the webhook route

New file `src/app/api/webhooks/stripe/route.ts`. This is a new pattern for the codebase (first webhook route) — no `auth()`, raw body required for signature verification (Next.js Route Handlers don't parse the body automatically, so `request.text()` already gives the raw bytes Stripe signed — no extra config needed, unlike the old Pages Router's `bodyParser: false`):

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isActiveSubscriptionStatus, isStripeConfigured, stripeClient } from "@/lib/stripe";

/**
 * Stripe webhook — the single source of truth for `User.isPro`. Every event
 * handled here re-derives isPro from the subscription's *current* status
 * rather than trusting the event type alone, so out-of-order delivery (Stripe
 * doesn't guarantee ordering) can't leave a stale isPro value.
 *
 * Auth-free by necessity (Stripe calls this directly); authenticity comes from
 * the signature check below, not a session. Do not add IP rate limiting here —
 * Stripe's source IPs are shared/dynamic and it already retries on non-2xx.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = stripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
          await syncSubscription(
            typeof checkoutSession.subscription === "string"
              ? checkoutSession.subscription
              : checkoutSession.subscription.id,
            checkoutSession.customer,
          );
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription.id, subscription.customer);
        break;
      }
      default:
        // Unhandled event types are ignored, not errored — Stripe sends many
        // event types we don't act on (invoices, payment methods, etc.).
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    // 500 so Stripe retries — an isPro sync failure should not be silently dropped.
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Re-fetches the subscription from Stripe (rather than trusting the event
 * payload alone) and writes isPro + stripeSubscriptionId from its *current*
 * state — makes the handler idempotent and safe against out-of-order events.
 */
async function syncSubscription(
  subscriptionId: string,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<void> {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return;

  const stripe = stripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const active = isActiveSubscriptionStatus(subscription.status);

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    // No matching user (e.g. a test-mode event against a stale customer) —
    // nothing to sync, not an error.
    console.warn(`Stripe webhook: no user for customer ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: active,
      stripeSubscriptionId: active ? subscription.id : null,
    },
  });
}
```

`checkout.session.completed` is handled explicitly (fires once, right after successful payment — the fastest path to flipping `isPro`) and then `customer.subscription.updated`/`customer.subscription.deleted` keep it in sync for the subscription's whole lifecycle (renewals, plan switches via the Billing Portal, cancellations, failed-renewal downgrades to `past_due`/`canceled`). Not handling `invoice.payment_failed` directly is deliberate: Stripe's own subscription **status** already reflects payment failures (moves to `past_due`, then `canceled` per the product's configured retry schedule), and `customer.subscription.updated` fires on each of those transitions — so re-deriving from `subscription.status` in one place (`syncSubscription`) is simpler and more consistent than handling invoice events too.

### 4.5 Session sync — the fix from the research prompt's Notes

Per the notes in `context/research/stripe-integration-research.md`, apply the "always sync from DB" workaround, since `trigger === "update"` doesn't reliably catch a webhook-driven change with no client-side `update()` call to trigger it:

**`src/types/next-auth.d.ts`** — add `isPro` to both `Session` and `JWT`:

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
```

**`src/auth.ts`** — extend both callbacks:

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }

    // Always sync isPro from the database so a Stripe webhook's change is
    // picked up on the next request, without depending on trigger === "update"
    // (which nothing in this app currently calls anyway).
    if (token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { isPro: true },
      });
      token.isPro = dbUser?.isPro ?? false;
    }

    return token;
  },
  session({ session, token }) {
    if (token.id) {
      session.user.id = token.id as string;
    }
    session.user.isPro = token.isPro ?? false;
    return session;
  },
},
```

Cost/tradeoff worth flagging explicitly: this adds one `prisma.user.findUnique` per JWT validation — i.e. on most authenticated requests, since NextAuth validates the JWT on every `auth()` call, not just page loads (`src/proxy.ts`'s matcher covers `/dashboard`, `/items`, `/profile`, `/collections`, `/settings`, `/favorites`, and `TopBar.tsx`/every action calls `auth()` again). This is the same tradeoff the research prompt's notes already accepted explicitly ("adds one small DB query per session validation but guarantees the session stays in sync"). It's a single indexed primary-key lookup (cheap), but it is a real, permanent per-request cost — if it becomes a measurable problem later, the standard fix is switching the `id` field selection to also pull `isPro` inside `PrismaAdapter`'s own session handling, or moving to database sessions instead of JWT (a bigger change, out of scope here).

### 4.6 Settings UI — new Billing card

**`src/lib/db/billing.ts`** (new) — the read side, mirroring `src/lib/db/profile.ts`'s shape:

```ts
import { prisma } from "@/lib/prisma";

export interface BillingAccount {
  isPro: boolean;
  hasStripeCustomer: boolean;
}

export async function getBillingAccount(userId: string): Promise<BillingAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true, stripeCustomerId: true },
  });

  if (!user) return null;

  return { isPro: user.isPro, hasStripeCustomer: user.stripeCustomerId !== null };
}
```

**`src/components/settings/BillingSection.tsx`** (new, client) — mirrors `ChangePasswordForm`'s client-mutation-then-toast shape, but redirects to Stripe instead of showing inline success:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { PlanInterval } from "@/lib/stripe";

export function BillingSection({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState<PlanInterval | "portal" | null>(null);

  async function upgrade(interval: PlanInterval) {
    setLoading(interval);
    const result = await createCheckoutSession(interval);
    if (!result.success) {
      toast.error(result.error);
      setLoading(null);
      return;
    }
    window.location.href = result.url;
  }

  async function manage() {
    setLoading("portal");
    const result = await createBillingPortalSession();
    if (!result.success) {
      toast.error(result.error);
      setLoading(null);
      return;
    }
    window.location.href = result.url;
  }

  if (isPro) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          You&apos;re on the Pro plan. Manage your subscription, payment method, or invoices.
        </p>
        <Button onClick={manage} disabled={loading !== null}>
          {loading === "portal" ? "Opening…" : "Manage subscription"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        You&apos;re on the Free plan. Upgrade for unlimited items, collections, files, images, and AI features.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => upgrade("monthly")} disabled={loading !== null}>
          {loading === "monthly" ? "Redirecting…" : "Upgrade — $8/mo"}
        </Button>
        <Button variant="outline" onClick={() => upgrade("yearly")} disabled={loading !== null}>
          {loading === "yearly" ? "Redirecting…" : "Upgrade — $72/yr"}
        </Button>
      </div>
    </div>
  );
}
```

**`src/app/settings/page.tsx`** — add the card (between Editor preferences and Change password — billing is account-level, arguably belongs near the top; exact position is a judgment call, not load-bearing) and read the `?checkout=` query param for a confirmation/cancellation banner, mirroring `/sign-in`'s existing `verified=1`/`reset=1` banner convention:

```tsx
// new imports
import { BillingSection } from "@/components/settings/BillingSection";
import { getBillingAccount } from "@/lib/db/billing";

// PageProps<"/settings"> for the awaited searchParams — same generated-type
// pattern items/[type]/page.tsx already uses for params.
export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  const { checkout } = await searchParams;
  const [account, billing] = await Promise.all([
    getProfileAccount(user.id),
    getBillingAccount(user.id),
  ]);

  // ... existing header ...

  {checkout === "success" && (
    <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
      You&apos;re on Pro! It may take a moment to reflect everywhere.
    </p>
  )}

  <Card>
    <CardHeader>
      <CardTitle>Billing</CardTitle>
      <CardDescription>Manage your DevStash plan.</CardDescription>
    </CardHeader>
    <CardContent>
      <BillingSection isPro={billing?.isPro ?? false} />
    </CardContent>
  </Card>
```

---

## 5. Files to Create

| File | Purpose |
|---|---|
| `src/lib/stripe.ts` | Lazy Stripe client singleton, price-id lookup, `isActiveSubscriptionStatus` (§4.1) |
| `src/lib/plan-limits.ts` | `FREE_ITEM_LIMIT`, `FREE_COLLECTION_LIMIT`, `PRO_ONLY_ITEM_TYPES`, `isFeatureGatingEnabled()` (§4.2) |
| `src/lib/plan-limits.test.ts` | Unit tests for the above (pure, no mocks) |
| `src/actions/billing.ts` | `createCheckoutSession`, `createBillingPortalSession` Server Actions (§4.3) |
| `src/actions/billing.test.ts` | Unit tests, `vi.mock` on `@/auth`, `@/lib/prisma`, `@/lib/stripe` |
| `src/app/api/webhooks/stripe/route.ts` | Webhook handler (§4.4) |
| `src/lib/db/billing.ts` | `getBillingAccount(userId)` read query (§4.6) |
| `src/components/settings/BillingSection.tsx` | Client UI for the Settings Billing card (§4.6) |

### 5.1 `src/lib/db/items.ts` — new counting function (§2.3 prerequisite)

Add alongside the existing functions, correctly `userId`-scoped (do **not** reuse the demo-scoped `getItemStats`):

```ts
/** Total items owned by userId — used by the free-tier item-count gate. */
export async function getItemCountForUser(userId: string): Promise<number> {
  return prisma.item.count({ where: { userId } });
}
```

---

## 6. Files to Modify

### 6.1 `package.json`

```diff
   "dependencies": {
     "@auth/prisma-adapter": "^2.11.3",
     "@aws-sdk/client-s3": "^3.1128.0",
     ...
+    "stripe": "^19.0.0",
     ...
   }
```
(Confirm the current major via `npm view stripe version` at implementation time rather than trusting this number verbatim.)

### 6.2 `src/types/next-auth.d.ts`

Add `isPro` to `Session.user` and a `JWT` augmentation — full replacement shown in §4.5.

### 6.3 `src/auth.ts`

Extend the `jwt`/`session` callbacks per §4.5. Needs `import { prisma } from "@/lib/prisma";` (not currently imported at the top level of this exact callback, though the file already imports it for the `Credentials` provider's `authorize`).

### 6.4 `.env.example`

The five Stripe vars already exist (added in `f31f37e`); add a comment header above them (they currently have none, unlike every other block) plus the new gating flag:

```diff
+# Stripe — subscription billing for DevStash Pro ($8/mo or $72/yr). The
+# secret/publishable keys and webhook secret come from the Stripe Dashboard;
+# the two price ids come from the Product you create there (see the Stripe
+# Dashboard Setup section of docs/stripe-integration-plan.md). Checkout and
+# the webhook are disabled/503 if STRIPE_SECRET_KEY is unset.
 STRIPE_SECRET_KEY=""
 STRIPE_PUBLISHABLE_KEY=""
 STRIPE_WEBHOOK_SECRET=""
 STRIPE_PRICE_ID_MONTHLY=""
 STRIPE_PRICE_ID_YEARLY=""
+
+# Set to "true" to actually enforce Pro limits/gating (item/collection caps,
+# file/image upload restriction). Defaults to disabled per project-overview.md
+# §7's dev note: "during development all users get full access regardless of
+# isPro." Flip this once ready to launch paid gating.
+FEATURE_GATING_ENABLED="false"
```

(`STRIPE_PUBLISHABLE_KEY` is not actually read anywhere in this plan — the Checkout redirect happens server-side via `checkoutSession.url`, not client-side Stripe.js. Left in `.env.example` since it's already there and does no harm; flagged here so it isn't mistaken for a wiring gap.)

### 6.5 `src/actions/items.ts` — gate `createItem`

Insert the count/type checks after Zod validation, before the file-URL check that's already there:

```diff
+import { getItemCountForUser } from "@/lib/db/items";
+import {
+  FREE_ITEM_LIMIT,
+  PRO_ONLY_ITEM_TYPES,
+  isFeatureGatingEnabled,
+  itemLimitMessage,
+  proTypeMessage,
+} from "@/lib/plan-limits";
+import { prisma } from "@/lib/prisma";
 ...
   const parsed = createItemSchema.safeParse(input);
   if (!parsed.success) {
     return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
   }

+  if (isFeatureGatingEnabled()) {
+    const user = await prisma.user.findUnique({
+      where: { id: session.user.id },
+      select: { isPro: true },
+    });
+
+    if (!user?.isPro) {
+      if (PRO_ONLY_ITEM_TYPES.includes(parsed.data.type)) {
+        return { success: false, error: proTypeMessage() };
+      }
+
+      const itemCount = await getItemCountForUser(session.user.id);
+      if (itemCount >= FREE_ITEM_LIMIT) {
+        return { success: false, error: itemLimitMessage() };
+      }
+    }
+  }
+
   if (
     (FILE_ITEM_TYPES as readonly string[]).includes(parsed.data.type) &&
     (parsed.data.fileUrl === null || r2KeyFromUrl(parsed.data.fileUrl) === null)
   ) {
```

Note this reads `session.user.isPro` would be simpler than a fresh `prisma.user.findUnique` now that §4.5 puts `isPro` on the session — but the session's `isPro` is only as fresh as the last JWT validation, and a Server Action mutating billing-adjacent state (creating an item that counts against a limit) is exactly the place to prefer a direct DB read over a potentially-stale token claim. This mirrors why `changePasswordAction` re-reads the password hash from the DB instead of trusting anything cached. Use `session.user.isPro` freely in **read-only UI** (§6.8) where a few seconds of staleness is harmless; prefer a DB read at the actual enforcement point.

### 6.6 `src/app/api/collections/route.ts` — gate `POST`

```diff
+import { getCollectionStats } from "@/lib/db/collections";
+import {
+  FREE_COLLECTION_LIMIT,
+  collectionLimitMessage,
+  isFeatureGatingEnabled,
+} from "@/lib/plan-limits";
+import { prisma } from "@/lib/prisma";
 ...
   if (!parsed.success) {
     return NextResponse.json({ success: false, error: ... }, { status: 400 });
   }

+  if (isFeatureGatingEnabled()) {
+    const user = await prisma.user.findUnique({
+      where: { id: session.user.id },
+      select: { isPro: true },
+    });
+
+    if (!user?.isPro) {
+      const stats = await getCollectionStats(session.user.id);
+      if (stats.total >= FREE_COLLECTION_LIMIT) {
+        return NextResponse.json(
+          { success: false, error: collectionLimitMessage() },
+          { status: 403 },
+        );
+      }
+    }
+  }
+
   try {
     const collection = await createCollection(session.user.id, parsed.data);
```

`getCollectionStats` is already correctly `userId`-scoped (§2.2), so no new query function is needed here — unlike the items side.

### 6.7 `src/app/settings/page.tsx`

Add the Billing card and checkout-status banner — full diff context in §4.6.

### 6.8 Optional / lower priority

These are real gaps this plan surfaces but are not required for a working subscription flow — call out to the user before building:

- **`src/components/dashboard/SidebarTypesNav.tsx` / `CreateItemDialog.tsx`** — once `FEATURE_GATING_ENABLED=true`, a free user can still *open* the file/image type picker and only gets rejected on submit (the server action, §6.5). Disabling those buttons client-side (using `session.user.isPro` from §4.5, threaded down as a prop) would be a better UX but isn't required for correctness — the server check is authoritative either way, matching this codebase's established "Zod/server action is the source of truth, client only guards the button" convention used everywhere else (`createItemSchema`'s URL-for-links rule, `updateItemSchema`'s title-required rule).
- **`src/components/homepage/PricingSection.tsx`** — "Upgrade to Pro" currently always links to `/register`, even for an already-signed-in visitor (the homepage already threads `isAuthenticated` into `Navbar`/`Hero` for exactly this kind of session-aware CTA — `src/app/page.tsx`). Wiring it to `createCheckoutSession` for signed-in users is a nice follow-up, not a blocker — a signed-in user can always get to `/settings` to upgrade.

---

## 7. Testing Checklist

### 7.1 Automated (Vitest — `src/actions/**`, `src/lib/**` only, per project convention)

- [ ] `src/lib/plan-limits.test.ts`: `isFeatureGatingEnabled()` true/false/unset; `itemLimitMessage`/`collectionLimitMessage`/`proTypeMessage` return expected strings; `PRO_ONLY_ITEM_TYPES` matches `FILE_ITEM_TYPES`.
- [ ] `src/lib/stripe.ts`: `isActiveSubscriptionStatus` — `active`/`trialing` → true, `past_due`/`canceled`/`unpaid`/`incomplete_expired` → false. `priceIdFor` throws when the env var is unset.
- [ ] `src/actions/billing.test.ts` (mock `@/auth`, `@/lib/prisma`, `@/lib/stripe`):
  - `createCheckoutSession`: unauthenticated → error; Stripe unconfigured → error; already-Pro user → error; new customer → creates Stripe customer + persists `stripeCustomerId` + returns checkout URL; existing `stripeCustomerId` → reuses it, no second `customers.create` call; Stripe SDK throw → generic error message, not leaked.
  - `createBillingPortalSession`: unauthenticated → error; no `stripeCustomerId` → error; success → returns portal URL.
- [ ] `src/actions/items.test.ts` additions: `createItem` with `FEATURE_GATING_ENABLED=true` + free user at/over 50 items → rejected with the limit message; same flag + free user under the limit → succeeds; Pro user over 50 → succeeds (no limit); `file`/`image` type + free user → rejected regardless of count; `FEATURE_GATING_ENABLED` unset/false → no check runs at all (current behavior preserved).
- [ ] Collection creation equivalent, either as a new `src/app/api/collections/route.test.ts` (would be this project's first API-route test — check whether that's in scope/wanted) or, if route handlers stay untested by convention, at minimum cover the underlying limit-check logic via `plan-limits.test.ts`.

### 7.2 Manual / browser (this project does not unit-test components, routes with no pure logic, or webhooks)

- [ ] **Stripe CLI webhook forwarding** (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) against a local dev server:
  - `stripe trigger checkout.session.completed` (or a real test-mode checkout) → `User.isPro` flips true, `stripeSubscriptionId` populated — verify via Neon MCP against the `development` branch.
  - `stripe trigger customer.subscription.updated` with `status=past_due` → `isPro` flips false.
  - `stripe trigger customer.subscription.deleted` → `isPro` false, `stripeSubscriptionId` cleared.
  - An invalid/forged signature → 400, no DB write.
  - A duplicate delivery of the same event (Stripe CLI supports resending) → idempotent, no error, same end state.
- [ ] Real browser checkout flow, test mode, both intervals:
  - `/settings` → Upgrade $8/mo → Stripe Checkout (test card `4242 4242 4242 4242`) → redirected to `/settings?checkout=success` → banner shows → (after the JWT re-syncs, next request) sidebar/session reflects Pro.
  - Same for the $72/yr price.
  - Cancel mid-checkout → redirected to `/settings?checkout=canceled`, `isPro` unchanged.
- [ ] Billing Portal: Pro user → "Manage subscription" → real Stripe portal loads with the correct customer's subscription → cancel from there → webhook fires → `isPro` flips false within one webhook round-trip.
- [ ] Gating, with `FEATURE_GATING_ENABLED=true` locally:
  - Free user at exactly 50 items → 51st creation attempt blocked with the limit toast; Pro user unaffected.
  - Free user at exactly 3 collections → 4th blocked; Pro user unaffected.
  - Free user attempting a `file`/`image` item → blocked regardless of item count.
  - Confirm `FEATURE_GATING_ENABLED` unset (or `"false"`) fully restores today's "everyone gets full access" behavior — this is the default and must not regress.
- [ ] Multiple browser tabs / an already-open session during a webhook-driven `isPro` change — confirm the change is visible after a reload (not necessarily instantly, per the research notes' accepted tradeoff), not stuck stale indefinitely.
- [ ] `npm test`, `npm run build`, `npm run lint` all pass.

---

## 8. Stripe Dashboard Setup Steps

1. **Create the Product.** Dashboard → Product catalog → + Add product. Name: "DevStash Pro". Description optional.
2. **Add two recurring Prices** on that product:
   - Monthly: $8.00 USD, billing period "Monthly".
   - Yearly: $72.00 USD, billing period "Yearly".
   Copy each price's `price_...` id into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.
3. **Get API keys.** Developers → API keys. Copy the **Secret key** (`sk_test_...` in test mode) into `STRIPE_SECRET_KEY`, the **Publishable key** into `STRIPE_PUBLISHABLE_KEY` (kept for completeness per §6.4's note — not currently read by any code in this plan).
4. **Set up the webhook endpoint.**
   - Local dev: use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) — it prints a `whsec_...` secret; put that in `STRIPE_WEBHOOK_SECRET` for local development.
   - Deployed environment: Developers → Webhooks → + Add endpoint, URL `https://<your-domain>/api/webhooks/stripe`, events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy that endpoint's own signing secret into the deployed environment's `STRIPE_WEBHOOK_SECRET` (it is **different** from the CLI's local secret).
5. **Enable the Billing Portal.** Dashboard → Settings → Billing → Customer portal (or Billing Portal settings, depending on current dashboard nav — verify against the live UI, it's been renamed before) — turn it on, and confirm "Cancel subscription" and "Update payment method" are allowed (defaults are fine for MVP). Without this step, `createBillingPortalSession` (§4.3) will fail at the Stripe API level with a configuration error.
6. **Test mode vs. live mode.** Everything above should be done once in **test mode** first end-to-end (§7.2's checklist), then repeated in **live mode** with its own separate keys/webhook/price ids before accepting real payments. Test-mode and live-mode Products/Prices/webhook secrets are entirely separate — there is no "promote to live" button.
7. **Tax / billing address collection** (optional, not required for MVP): Dashboard → Tax settings, if the team wants Stripe Tax handling automatic sales-tax collection. Out of scope for this plan; flag as a follow-up decision, not a blocker.

---

## 9. Implementation Order

Sequenced so every intermediate step still builds/passes tests and nothing is gated behind a later step:

1. **`npm install stripe`**, add the `.env.example` additions (§6.4). No behavior change yet.
2. **`src/lib/stripe.ts`** (§4.1) + **`src/lib/plan-limits.ts`** (§4.2) + their unit tests (§7.1). Pure/foundational, nothing depends on the DB or auth yet.
3. **Session sync** (§4.5: `next-auth.d.ts`, `auth.ts`). Low risk on its own — `isPro` will just always read `false` until step 5 exists, no visible change.
4. **`src/lib/db/billing.ts`** (§4.6) + **`src/lib/db/items.ts`**'s `getItemCountForUser` (§5.1). Pure additions, no call sites yet.
5. **`src/actions/billing.ts`** (§4.3) + its tests. Nothing calls it yet, so this is safe to land and test in isolation.
6. **`src/app/api/webhooks/stripe/route.ts`** (§4.4). Verify against Stripe CLI forwarding (§7.2) before moving on — this is the step where `isPro` can first actually flip.
7. **Stripe Dashboard setup** (§8), test mode. Do this now so step 8's UI has something real to hit.
8. **Settings UI**: `BillingSection.tsx` + `settings/page.tsx` changes (§4.6). Full manual checkout/portal walkthrough (§7.2) end-to-end in test mode.
9. **Gating enforcement**: `src/actions/items.ts` (§6.5) + `src/app/api/collections/route.ts` (§6.6), landed with `FEATURE_GATING_ENABLED` defaulting to `"false"` so this is a no-op until explicitly flipped — safe to merge and keep dev behavior unchanged, then flip the flag in a controlled environment to test §7.2's gating checklist.
10. **Optional follow-ups** (§6.8) — client-side disabling of Pro-only UI, homepage CTA wiring — only after the above is verified working, and only if the user wants them now rather than as a later feature.

At each step, follow the project's existing workflow (`context/ai-interaction.md`): a feature branch, `npm test` + `npm run build` before committing, no auto-commit.
