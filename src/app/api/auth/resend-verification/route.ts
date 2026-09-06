import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit("resend-verification", `${ip}:${email}`, 3, "15 m");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  if (isEmailVerificationEnabled()) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.password && !user.emailVerified) {
      const token = await createVerificationToken(user.email);
      const verifyUrl = new URL("/api/auth/verify-email", request.url);
      verifyUrl.searchParams.set("token", token);

      try {
        await sendVerificationEmail(user.email, verifyUrl.toString());
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    }
  }

  return NextResponse.json({ success: true });
}
