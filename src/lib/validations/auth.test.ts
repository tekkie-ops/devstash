import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("registerSchema", () => {
  const valid = {
    name: "Ada",
    email: "ada@example.com",
    password: "supersecret",
    confirmPassword: "supersecret",
  };

  it("accepts a well-formed payload", () => {
    expect(registerSchema.parse(valid)).toMatchObject({ email: "ada@example.com" });
  });

  it("trims surrounding whitespace on name and email", () => {
    const parsed = registerSchema.parse({
      ...valid,
      name: "  Ada  ",
      email: "  ada@example.com  ",
    });
    expect(parsed.name).toBe("Ada");
    expect(parsed.email).toBe("ada@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("rejects mismatched passwords and points at confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0]?.message).toBe("Passwords do not match");
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email and trims it", () => {
    expect(forgotPasswordSchema.parse({ email: " user@example.com " })).toEqual({
      email: "user@example.com",
    });
  });

  it("rejects a missing email", () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires a non-empty token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "supersecret",
      confirmPassword: "supersecret",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Missing reset token");
  });
});

describe("changePasswordSchema", () => {
  it("rejects when the new passwords do not match", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
      confirmNewPassword: "newpassword2",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmNewPassword"]);
  });
});
