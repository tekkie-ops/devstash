import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError, CredentialsSignin } from "next-auth";

import { signInWithCredentials } from "@/actions/auth";

const { signInMock, signOutMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: signInMock,
  signOut: signOutMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.9" })),
}));

// Stub the two error classes the action branches on with `instanceof`.
vi.mock("next-auth", () => {
  class MockAuthError extends Error {}
  class MockCredentialsSignin extends MockAuthError {
    code?: string;
    constructor(code?: string) {
      super("credentials sign-in failed");
      this.code = code;
    }
  }
  return { AuthError: MockAuthError, CredentialsSignin: MockCredentialsSignin };
});

const initialState = { success: false };

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  signInMock.mockReset();
});

describe("signInWithCredentials", () => {
  it("rejects a submission missing email or password", async () => {
    const result = await signInWithCredentials(
      initialState,
      formData({ email: "user@example.com" }),
    );

    expect(result).toEqual({
      success: false,
      error: "Email and password are required",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("signs in and defaults the redirect to /dashboard", async () => {
    signInMock.mockResolvedValueOnce(undefined);

    const result = await signInWithCredentials(
      initialState,
      formData({ email: "user@example.com", password: "supersecret" }),
    );

    expect(result).toEqual({ success: true });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "supersecret",
      redirectTo: "/dashboard",
    });
  });

  it("threads a provided callbackUrl through to signIn", async () => {
    signInMock.mockResolvedValueOnce(undefined);

    await signInWithCredentials(
      initialState,
      formData({
        email: "user@example.com",
        password: "supersecret",
        callbackUrl: "/items/snippets",
      }),
    );

    expect(signInMock).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/items/snippets" }),
    );
  });

  it("surfaces the unverified-email case with its code", async () => {
    signInMock.mockRejectedValueOnce(new CredentialsSignin("email_not_verified"));

    const result = await signInWithCredentials(
      initialState,
      formData({ email: "user@example.com", password: "supersecret" }),
    );

    expect(result.success).toBe(false);
    expect(result.code).toBe("email_not_verified");
    expect(result.error).toMatch(/verify your email/i);
  });

  it("maps a generic AuthError to an invalid-credentials message", async () => {
    signInMock.mockRejectedValueOnce(new AuthError());

    const result = await signInWithCredentials(
      initialState,
      formData({ email: "user@example.com", password: "wrong-password" }),
    );

    expect(result).toEqual({
      success: false,
      error: "Invalid email or password",
    });
  });

  it("re-throws unexpected errors (e.g. Next redirects)", async () => {
    signInMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(
      signInWithCredentials(
        initialState,
        formData({ email: "user@example.com", password: "supersecret" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
