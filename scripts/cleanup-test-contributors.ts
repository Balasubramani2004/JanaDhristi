/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Removes ALL test contributor records.
 * Run:  npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all test records
  const toDelete = await prisma.supporter.findMany({
    where: {
      OR: [
        { name: { startsWith: "[TEST]" } },
        { email: { endsWith: "@test.forthepeople.in" } },
      ],
    },
    select: { id: true, name: true, tier: true, amount: true, subscriptionStatus: true },
    orderBy: { createdAt: "desc" },
  });

  if (toDelete.length === 0) {
    console.log("✅ No test records found. Database is clean.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${toDelete.length} test records to remove:\n`);
  for (const r of toDelete) {
    console.log(
      `  ${r.name.padEnd(30)} │ ${r.tier.padEnd(10)} │ ₹${r.amount.toLocaleString("en-IN").padEnd(8)} │ ${r.subscriptionStatus ?? "one-time"}`
    );
  }

  // Delete them
  const result = await prisma.supporter.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "[TEST]" } },
        { email: { endsWith: "@test.forthepeople.in" } },
      ],
    },
  });

  console.log(`\n✅ Deleted ${result.count} test records. Database is clean for deployment.\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
