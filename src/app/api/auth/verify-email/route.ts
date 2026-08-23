import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const signInUrl = new URL("/sign-in", request.nextUrl.origin);

  if (!token) {
    signInUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(signInUrl);
  }

  const verificationToken = await prisma.verificationToken.findUnique({ where: { token } });

  if (!verificationToken || verificationToken.expires < new Date()) {
    if (verificationToken) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    signInUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(signInUrl);
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
  } catch (error) {
    console.error("Failed to verify email", error);
    signInUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(signInUrl);
  }

  signInUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(signInUrl);
}
