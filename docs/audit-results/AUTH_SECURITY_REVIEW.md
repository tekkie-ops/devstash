# Auth Security Review

**Last audited:** 2026-09-06
**Scope:** NextAuth v5 credentials/GitHub providers, email verification, password reset, profile account management (change password / delete account)
**Not audited (handled by NextAuth):** CSRF protection, session-cookie flags, OAuth state/PKCE

## Summary

Password hashing, token generation, expiration, single-use enforcement, and the `reset:` prefix disambiguation are all implemented correctly and match current best practice. No Critical or High findings. The most important thing to fix is the total absence of rate limiting on the credential sign-in, register, forgot-password, reset-password, and verify-email endpoints — a real, unmitigated gap rather than a false positive. A second Medium finding is that JWT sessions are never invalidated after a password change or account deletion, which partially defeats the purpose of those actions for a user trying to lock out a stolen session.

## Findings

### Critical
No findings.

### High
No findings.

### Medium

- **File:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/verify-email/route.ts`, `src/auth.ts:40-62` (credentials `authorize`)
- **Issue:** None of these endpoints have any rate limiting or attempt-throttling. Confirmed by reading each route in full and grepping `src/` for `rate`/`limit`/`throttle` (no matches).
- **Impact:** An attacker can script unlimited credential-sign-in guesses against a known email, mass-register accounts, flood arbitrary inboxes via repeated `forgot-password` calls, or hammer `verify-email`/`reset-password` with token guesses at high volume (token entropy makes brute-forcing the token itself infeasible, but the endpoints still have no defense against being used as a spam/DoS vector).
- **Fix:** Add an IP+identifier (email) keyed rate limit (e.g. Upstash `Ratelimit` or a Redis sliding-window) in front of `register`, `forgot-password`, `reset-password`, `verify-email`, and inside the credentials `authorize` function — e.g. 5 attempts per 15 minutes per email+IP, returning HTTP 429 once exceeded.

- **File:** `src/auth.ts:16-22` (`jwt` callback), `src/actions/profile.ts:46-50` (`changePasswordAction`), `src/actions/profile.ts:55-63` (`deleteAccountAction`)
- **Issue:** Sessions use the JWT strategy with no server-side session store, and the `jwt` callback only sets `token.id` on initial sign-in — it never re-validates the token against current DB state (e.g. a `passwordChangedAt` timestamp, or that the user still exists) on subsequent requests. This is the same architectural gap already documented in the 2026-09-06 Forgot Password history entry for the reset-password flow, but it applies equally — and was not previously called out — to `changePasswordAction` and `deleteAccountAction`, which didn't exist yet when that entry was written.
- **Impact:** If an attacker has a stolen/leaked session cookie, the victim changing their password (the standard remediation) does not revoke the attacker's already-issued JWT — it keeps working until natural expiry. Likewise, deleting an account does not invalidate any other still-signed-in device's session token.
- **Fix:** Add a `passwordChangedAt` field on `User`, stamp it in `changePasswordAction` (and effectively moot in `deleteAccountAction` since the row is gone), and check it in the `jwt` callback against the token's `iat` (or re-fetch the user) so a token issued before the change is rejected and forces re-authentication.

### Low

- **File:** `src/app/api/auth/forgot-password/route.ts:19-33`
- **Issue:** This is a documented, deliberate tradeoff (2026-09-06 Forgot Password history entry), not an oversight — but it remains a real, unresolved minor risk. The branch for an account with a password (`user?.password` true) does a token write plus an awaited email send before responding; the "no such account" and "GitHub-only" branches return immediately. The response body is identical (`{ success: true }`) in all cases, but response latency differs.
- **Impact:** An attacker measuring response times across many submitted emails could probabilistically infer which addresses belong to real, password-based accounts, weakening the endpoint's intended account-enumeration resistance.
- **Fix:** Make the "no-op" branches take comparable time — e.g. `await` a fixed-delay no-op or a dummy `bcrypt.hash` call on the branches that currently return immediately — so total response time is constant regardless of account state.

## Passed Checks

- Password hashing uses `bcrypt` at cost factor 12 everywhere a password is hashed (`src/app/api/auth/register/route.ts:30`, `src/app/api/auth/reset-password/route.ts:38`, `src/actions/profile.ts:46`) — confirmed via WebSearch that cost 12 meets current (2026) OWASP-aligned guidance (minimum 10, 12-13 recommended for modern hardware).
- No plaintext password or password hash is ever returned to a client or logged: `src/auth.ts:61` returns only `{ id, email, name, image }` from `authorize`; `src/lib/db/profile.ts:39-50` selects the `password` column internally only to compute a `hasPassword: boolean`, never exposing the hash itself; no `console.log`/`console.error` call anywhere in the auth code paths logs a password or token value (verified by reading every catch block in the register/forgot-password/reset-password/verify-email routes — they log only the caught `Error` object).
- Verification and reset tokens are generated with `crypto.randomBytes(32).toString("hex")` (`src/lib/tokens.ts:12,26`) — a cryptographically secure source with 256 bits of entropy, well above the minimum needed.
- Token expiration is enforced server-side at the point of use, not just cosmetically: `src/app/api/auth/verify-email/route.ts:15` and `src/app/api/auth/reset-password/route.ts:32` both check `expires < new Date()` before honoring the token.
- Tokens are single-use: both flows delete the token row in the same transaction that consumes it (`verify-email/route.ts:24-30`, `reset-password/route.ts:41-44`), and an already-expired token found on lookup is explicitly deleted rather than silently ignored, so it can't be replayed.
- Requesting a new token invalidates any previous outstanding one for that identifier first — `createVerificationToken` and `createPasswordResetToken` both `deleteMany` on the identifier before creating the new row (`src/lib/tokens.ts:10`, `:24`), so live tokens don't accumulate.
- The `reset:` prefix scheme is correctly enforced, not just documented: `src/app/api/auth/reset-password/route.ts:28` rejects any token whose `identifier` doesn't start with `PASSWORD_RESET_TOKEN_PREFIX` before trusting it, so a leaked/misrouted email-verification token cannot be replayed as a password reset.
- `forgot-password` never reveals account existence or auth method in its response body — it returns `{ success: true }` for a nonexistent email, a GitHub-only account, and a real password account alike (`src/app/api/auth/forgot-password/route.ts:33`); the one caveat is the documented timing side-channel above.
- `changePasswordAction` requires and `bcrypt.compare`s the current password before permitting a new one (`src/actions/profile.ts:41-44`) — a signed-in session alone is not sufficient.
- `deleteAccountAction` and `changePasswordAction` both derive the target account exclusively from `session.user.id` obtained via `auth()` (`src/actions/profile.ts:17-18`, `:56-57`) — no client-supplied id is accepted anywhere in the profile mutation path.
- `getProfileAccount`/`getProfileStats` (`src/lib/db/profile.ts`) are parameterized by an explicit `userId` sourced from the real session in `src/app/profile/page.tsx:26-36`, not a hardcoded demo-user id.
- No manual cookie/CSRF/OAuth-state overrides exist in `src/auth.ts` or `src/auth.config.ts` (grepped for `useSecureCookies`, `cookies:`, `httpOnly`, `sameSite` — no matches) — NextAuth's secure defaults are left untouched.
- No hardcoded secrets found in `src/` (grep for secret/apiKey/password literals only matched Prisma-generated field-name constants, not real values); the only `Math.random()` usage in `src/` is an unrelated skeleton-loading-width randomizer in `src/components/ui/sidebar.tsx`, outside the auth code paths.
- All `bcrypt.hash`/`bcrypt.compare` calls found in `src/` are properly `await`ed; no missing-await patterns found.
