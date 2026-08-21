import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
  console.log("Connected to database:", result);

  const userCount = await prisma.user.count();
  console.log(`User count: ${userCount}`);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
