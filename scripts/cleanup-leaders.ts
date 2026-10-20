/**
 * Cleanup duplicate leaders across all districts.
 * Uses raw SQL DISTINCT ON to identify and remove duplicates,
 * keeping the most recently updated record per name+role.
 *
 * Run: DATABASE_URL=<neon-url> npx tsx scripts/cleanup-leaders.ts
 *
 * Note: This script MUST be run with the same DATABASE_URL that Vercel uses.
 * Check Vercel dashboard → Project → Environment Variables → DATABASE_URL
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Starting leader deduplication...\n");

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true },
  });

  let totalDeleted = 0;

  for (const district of districts) {
    // Step 1: Get IDs of leaders to keep (one per name+role, newest)
    const keepIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT ON (LOWER("name"), LOWER("role")) id
      FROM "Leader"
      WHERE "districtId" = ${district.id}
      ORDER BY LOWER("name"), LOWER("role"), id DESC
    `;
    const keepIdSet = new Set(keepIds.map(r => r.id));

    // Step 2: Count total and duplicates
    const allIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Leader" WHERE "districtId" = ${district.id}
    `;

    const duplicateIds = allIds
      .map(r => r.id)
      .filter(id => !keepIdSet.has(id));

    if (duplicateIds.length > 0) {
      await prisma.leader.deleteMany({
        where: { id: { in: duplicateIds } },
      });
      totalDeleted += duplicateIds.length;
      console.log(
        `  ${district.name}: deleted ${duplicateIds.length} duplicates, kept ${keepIds.length}`
      );
    } else {
      console.log(`  ${district.name}: clean (${keepIds.length} leaders)`);
    }
  }

  // Summary
  console.log(`\n✅ Total duplicates removed: ${totalDeleted}`);
  console.log("\n--- Final leader counts ---");
  for (const district of districts) {
    const count = await prisma.leader.count({
      where: { districtId: district.id },
    });
    console.log(`  ${district.name}: ${count} leaders`);
  }

  console.log("\nDone!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
