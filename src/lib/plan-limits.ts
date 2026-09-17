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

export function aiFeatureMessage(): string {
  return "AI features are a Pro feature. Upgrade to Pro to use them.";
}
