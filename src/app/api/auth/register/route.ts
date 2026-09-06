import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit("register", ip, 3, "1 h");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationEnabled = isEmailVerificationEnabled();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      emailVerified: verificationEnabled ? null : new Date(),
    },
  });

  if (verificationEnabled) {
    const token = await createVerificationToken(user.email);
    const verifyUrl = new URL("/api/auth/verify-email", request.url);
    verifyUrl.searchParams.set("token", token);

    try {
      await sendVerificationEmail(user.email, verifyUrl.toString());
    } catch (error) {
      console.error("Failed to send verification email", error);
    }
  }

  return NextResponse.json(
    { success: true, data: { id: user.id, name: user.name, email: user.email } },
    { status: 201 }
  );
}
