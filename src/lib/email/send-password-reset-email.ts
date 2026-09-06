import { resend } from "@/lib/resend";

const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <p>We received a request to reset your DevStash password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
