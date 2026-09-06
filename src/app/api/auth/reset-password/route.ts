import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { PASSWORD_RESET_TOKEN_PREFIX } from "@/lib/tokens";

function invalidTokenResponse() {
  return NextResponse.json(
    { success: false, error: "This reset link is invalid or has expired" },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith(PASSWORD_RESET_TOKEN_PREFIX)) {
    return invalidTokenResponse();
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return invalidTokenResponse();
  }

  const email = record.identifier.slice(PASSWORD_RESET_TOKEN_PREFIX.length);
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { password: passwordHash } }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
  } catch (error) {
    console.error("Failed to reset password", error);
    return invalidTokenResponse();
  }

  return NextResponse.json({ success: true });
}
