/**
 * ForThePeople.in — De-duplicate Subscription rows
 * Run: npx tsx scripts/fix-duplicate-subscriptions.ts
 *
 * Root cause: earlier seed iterations inserted the same service under slightly
 * different names (e.g. "OpenRouter" vs "Vercel Pro"), and the Costs tab also
 * auto-created entries. Now that `serviceName` is @unique, we need to collapse
 * existing duplicates before the seed runs cleanly.
 *
 * Rules:
 *   - Group by lowercased/trimmed `serviceName` OR `name` (fallback).
 *   - Keep the row with the latest `updatedAt`.
 *   - Merge non-null fields from older rows into the keeper (so we don't lose
 *     a dashboardUrl or a renewal date that was only set on the loser).
 *   - Delete the losers.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function canonicalKey(row: { serviceName: string | null; name: string }): string {
  return (row.serviceName ?? row.name ?? "").trim().toLowerCase();
}

async function main() {
  const rows = await prisma.subscription.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = canonicalKey(r);
    if (!key) continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(r);
    groups.set(key, bucket);
  }

  let kept = 0;
  let deleted = 0;

  for (const [key, bucket] of groups) {
    if (bucket.length <= 1) {
      kept++;
      continue;
    }
    const [keeper, ...losers] = bucket;

    // Merge non-null fields from losers into keeper (keeper wins on conflict).
    const merged: Record<string, unknown> = {};
    for (const field of Object.keys(keeper) as (keyof typeof keeper)[]) {
      if (field === "id" || field === "createdAt" || field === "updatedAt") continue;
      let value: unknown = keeper[field];
      if (value == null || value === "") {
        for (const l of losers) {
          const v = l[field];
          if (v != null && v !== "") {
            value = v;
            break;
          }
        }
      }
      (merged as Record<string, unknown>)[field] = value;
    }

    // Ensure serviceName is set on the keeper — needed for upsert semantics
    // in the seed script.
    if (!merged.serviceName) {
      merged.serviceName = key.replace(/\s+/g, "_");
    }

    await prisma.subscription.update({
      where: { id: keeper.id },
      data: merged,
    });

    const loserIds = losers.map((l) => l.id);
    await prisma.subscription.deleteMany({ where: { id: { in: loserIds } } });

    kept++;
    deleted += loserIds.length;
    console.log(`[dedup] ${key}: kept ${keeper.id}, removed ${loserIds.length}`);
  }

  console.log(`[dedup] done — kept=${kept} deleted=${deleted}`);
}

main()
  .catch((err) => {
    console.error("[dedup] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
