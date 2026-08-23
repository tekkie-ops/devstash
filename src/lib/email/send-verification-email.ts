import { resend } from "@/lib/resend";

const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your email for DevStash",
    html: `
      <p>Welcome to DevStash! Confirm your email address to finish setting up your account.</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
}
