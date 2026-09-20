import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-response";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit("forgot-password", ip, 3, "1 h");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if (parsed.response) return parsed.response;

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
