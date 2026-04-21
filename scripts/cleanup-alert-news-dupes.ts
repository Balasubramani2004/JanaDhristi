/**
 * JanaDhristi — Smart LocalAlert + NewsItem deduplication
 *
 * - LocalAlert: dedups by (districtId, normalized title). Keeps newest, marks older inactive.
 * - NewsItem: dedups by (districtId, normalized title). Keeps newest, deletes older.
 *
 * Safe to rerun (idempotent).
 *
 * Usage: npx tsx scripts/cleanup-alert-news-dupes.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

async function dedupLocalAlerts() {
  console.log("\n═══ LocalAlert Deduplication ═══");
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  });

  let totalDeactivated = 0;
  for (const d of districts) {
    const alerts = await prisma.localAlert.findMany({
      where: { districtId: d.id, active: true },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" }, // newest first
    });

    const seen = new Map<string, string>(); // normalized title -> kept id
    const toDeactivate: string[] = [];
    for (const a of alerts) {
      const key = normalizeTitle(a.title);
      if (!key) continue;
      if (seen.has(key)) {
        toDeactivate.push(a.id);
      } else {
        seen.set(key, a.id);
      }
    }

    if (toDeactivate.length > 0) {
      await prisma.localAlert.updateMany({
        where: { id: { in: toDeactivate } },
        data: { active: false },
      });
      console.log(`  ${d.slug}: marked ${toDeactivate.length} duplicate alerts inactive (kept ${seen.size} unique)`);
      totalDeactivated += toDeactivate.length;
    }
  }
  console.log(`  Total LocalAlerts deactivated: ${totalDeactivated}`);
}

async function dedupNewsItems() {
  console.log("\n═══ NewsItem Deduplication ═══");
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  });

  let totalDeleted = 0;
  for (const d of districts) {
    const news = await prisma.newsItem.findMany({
      where: { districtId: d.id },
      select: { id: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    const seen = new Map<string, string>();
    const toDelete: string[] = [];
    for (const n of news) {
      const key = normalizeTitle(n.title);
      if (!key) continue;
      if (seen.has(key)) {
        toDelete.push(n.id);
      } else {
        seen.set(key, n.id);
      }
    }

    if (toDelete.length > 0) {
      await prisma.newsItem.deleteMany({
        where: { id: { in: toDelete } },
      });
      console.log(`  ${d.slug}: deleted ${toDelete.length} duplicate news items (kept ${seen.size} unique)`);
      totalDeleted += toDelete.length;
    }
  }
  console.log(`  Total NewsItems deleted: ${totalDeleted}`);
}

async function main() {
  console.log("Smart LocalAlert + NewsItem dedup starting...");
  await dedupLocalAlerts();
  await dedupNewsItems();
  console.log("\n✅ Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
