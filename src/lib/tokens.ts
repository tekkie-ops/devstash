import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const PASSWORD_RESET_TOKEN_PREFIX = "reset:";

export async function createVerificationToken(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export async function createPasswordResetToken(email: string) {
  const identifier = `${PASSWORD_RESET_TOKEN_PREFIX}${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}
