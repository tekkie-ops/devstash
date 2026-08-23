import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const KEEP_EMAIL = "demo@devstash.io";

async function main() {
  const dryRun = !process.argv.includes("--yes");

  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  });

  if (usersToDelete.length === 0) {
    console.log("No users to delete — only the demo user exists.");
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) to delete (keeping ${KEEP_EMAIL}):`);
  for (const user of usersToDelete) {
    console.log(`  - ${user.email}`);
  }

  if (dryRun) {
    console.log(
      "\nDry run — no changes made. Re-run with --yes to delete these users and all their content."
    );
    return;
  }

  const emails = usersToDelete.map((user) => user.email);

  const { count: tokenCount } = await prisma.verificationToken.deleteMany({
    where: { identifier: { in: emails } },
  });

  const { count: userCount } = await prisma.user.deleteMany({
    where: { id: { in: usersToDelete.map((user) => user.id) } },
  });

  console.log(`\nDeleted ${userCount} user(s) and ${tokenCount} verification token(s).`);
  console.log(
    "Their items, collections, custom item types, accounts, and sessions were removed via cascading deletes."
  );
}

main()
  .catch((error) => {
    console.error("Failed to delete users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
