import { afterEach, describe, expect, it } from "vitest";

import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_ONLY_ITEM_TYPES,
  collectionLimitMessage,
  isFeatureGatingEnabled,
  itemLimitMessage,
  proTypeMessage,
} from "@/lib/plan-limits";
import { FILE_ITEM_TYPES } from "@/lib/validations/items";

const original = process.env.FEATURE_GATING_ENABLED;

afterEach(() => {
  if (original === undefined) {
    delete process.env.FEATURE_GATING_ENABLED;
  } else {
    process.env.FEATURE_GATING_ENABLED = original;
  }
});

describe("isFeatureGatingEnabled", () => {
  it("defaults to disabled when the env var is unset", () => {
    delete process.env.FEATURE_GATING_ENABLED;
    expect(isFeatureGatingEnabled()).toBe(false);
  });

  it("is enabled only for the exact string 'true'", () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    expect(isFeatureGatingEnabled()).toBe(true);
  });

  it("stays disabled for any other value", () => {
    process.env.FEATURE_GATING_ENABLED = "false";
    expect(isFeatureGatingEnabled()).toBe(false);
    process.env.FEATURE_GATING_ENABLED = "1";
    expect(isFeatureGatingEnabled()).toBe(false);
  });
});

describe("limit messages", () => {
  it("itemLimitMessage mentions the free item limit", () => {
    expect(itemLimitMessage()).toBe(
      `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
    );
  });

  it("collectionLimitMessage mentions the free collection limit", () => {
    expect(collectionLimitMessage()).toBe(
      `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
    );
  });

  it("proTypeMessage explains the files/images restriction", () => {
    expect(proTypeMessage()).toBe(
      "Files and images are a Pro feature. Upgrade to Pro to upload them.",
    );
  });
});

describe("PRO_ONLY_ITEM_TYPES", () => {
  it("matches FILE_ITEM_TYPES", () => {
    expect(PRO_ONLY_ITEM_TYPES).toEqual(FILE_ITEM_TYPES);
  });
});
