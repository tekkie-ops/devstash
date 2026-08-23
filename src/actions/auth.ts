"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type SignInState = {
  success: boolean;
  error?: string;
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

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: resolveCallbackUrl(formData),
    });
  } catch (error) {
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
