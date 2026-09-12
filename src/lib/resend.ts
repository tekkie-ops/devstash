import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

/** Shared sender identity for every transactional email — see send-*-email.ts. */
export const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";
