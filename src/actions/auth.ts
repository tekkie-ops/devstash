"use server";

import { headers } from "next/headers";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn, signOut } from "@/auth";
import { checkRateLimit, getClientIp, rateLimitExceededMessage } from "@/lib/rate-limit";

export type SignInState = {
  success: boolean;
  error?: string;
  code?: string;
};

function resolveCallbackUrl(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  return typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard";
}

export async function signInWithCredentials(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const ip = getClientIp(await headers());
  const rateLimit = await checkRateLimit("login", `${ip}:${email}`, 5, "15 m");
  if (!rateLimit.success) {
    return { success: false, error: rateLimitExceededMessage(rateLimit.reset) };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: resolveCallbackUrl(formData),
    });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "email_not_verified") {
      return {
        success: false,
        error: "Please verify your email before signing in. Check your inbox for the link we sent.",
        code: "email_not_verified",
      };
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }

  return { success: true };
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: resolveCallbackUrl(formData) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
