import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit("forgot-password", ip, 3, "1 h");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.password) {
    const token = await createPasswordResetToken(email);
    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", token);

    try {
      await sendPasswordResetEmail(email, resetUrl.toString());
    } catch (error) {
      console.error("Failed to send password reset email", error);
    }
  }

  return NextResponse.json({ success: true });
}
