import { afterEach, describe, expect, it } from "vitest";

import { isEmailVerificationEnabled } from "@/lib/email-verification";

const original = process.env.EMAIL_VERIFICATION_ENABLED;

afterEach(() => {
  if (original === undefined) {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
  } else {
    process.env.EMAIL_VERIFICATION_ENABLED = original;
  }
});

describe("isEmailVerificationEnabled", () => {
  it("defaults to enabled when the env var is unset", () => {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("is disabled only for the exact string 'false'", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("stays enabled for any other value", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "true";
    expect(isEmailVerificationEnabled()).toBe(true);
    process.env.EMAIL_VERIFICATION_ENABLED = "0";
    expect(isEmailVerificationEnabled()).toBe(true);
  });
});
