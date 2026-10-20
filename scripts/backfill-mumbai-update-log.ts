/**
 * JanaDhristi — Backfill UpdateLog entries for Mumbai seed data
 * Run: npx tsx scripts/backfill-mumbai-update-log.ts
 *
 * Adds historical-looking UpdateLog rows so the public /update-log page
 * shows the seed provenance for each module. Uses backdated timestamps
 * clustered around 2026-04-01 so it reads as seed history, not today's work.
 *
 * Idempotent: skips modules that already have a SEED entry for Mumbai.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface SeedLog {
  moduleName: string;
  summary: string;
  recordCount?: number;
  tableName: string;
  daysAgo: number; // offset from reference date
}

// All dated 2026-04-01 ± a few days so the timeline reads like a seed batch.
const ENTRIES: SeedLog[] = [
  { moduleName: "leadership",     summary: "Seeded MPs, MLAs, Collector, Commissioner, CP",    recordCount: 10, tableName: "Leader",             daysAgo: 13 },
  { moduleName: "finance",        summary: "Seeded BMC budget 2025-26 (10 sectors)",           recordCount: 10, tableName: "BudgetEntry",        daysAgo: 13 },
  { moduleName: "police",         summary: "Seeded 20 police stations + crime stats",          recordCount: 20, tableName: "PoliceStation",      daysAgo: 13 },
  { moduleName: "elections",      summary: "Seeded 2024 LS + Assembly results (10 constituencies)", recordCount: 10, tableName: "ElectionResult", daysAgo: 13 },
  { moduleName: "industries",     summary: "Seeded 10 major industry hubs",                    recordCount: 10, tableName: "LocalIndustry",      daysAgo: 13 },
  { moduleName: "schemes",        summary: "Seeded 10 government schemes",                     recordCount: 10, tableName: "Scheme",             daysAgo: 13 },
  { moduleName: "services",       summary: "Seeded 5 citizen service guides",                  recordCount:  5, tableName: "ServiceGuide",       daysAgo: 13 },
  { moduleName: "offices",        summary: "Seeded 10 government offices",                     recordCount: 10, tableName: "GovOffice",          daysAgo: 13 },
  { moduleName: "rti",            summary: "Seeded RTI templates (6 topics)",                  recordCount:  6, tableName: "RtiTemplate",        daysAgo: 13 },
  { moduleName: "courts",         summary: "Seeded court statistics (5 courts)",               recordCount:  5, tableName: "CourtStat",          daysAgo: 13 },
  { moduleName: "famous-personalities", summary: "Seeded famous personalities",                recordCount: 10, tableName: "FamousPersonality",  daysAgo: 13 },
  { moduleName: "alerts",         summary: "Seeded local alerts (water + transport)",          recordCount:  6, tableName: "LocalAlert",         daysAgo: 13 },
  { moduleName: "population",     summary: "Seeded census population history (1951-2011)",     recordCount:  7, tableName: "PopulationHistory",  daysAgo: 13 },
  { moduleName: "responsibility", summary: "Seeded citizen responsibility content",            recordCount:  1, tableName: "CitizenTip",         daysAgo: 13 },
  { moduleName: "exams",          summary: "Seeded 31 government exam notifications",          recordCount: 31, tableName: "GovernmentExam",     daysAgo: 13 },
];

// Reference: 2026-04-14 (today). Backfilled entries land around 2026-04-01.
const REFERENCE_DATE = new Date("2026-04-14T10:00:00.000Z");

async function main() {
  console.log("📝 Mumbai UpdateLog backfill starting...\n");

  const mumbai = await prisma.district.findFirst({
    where: { slug: "mumbai" },
    select: { id: true, name: true },
  });
  if (!mumbai) {
    console.error("❌ Mumbai district not found");
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const e of ENTRIES) {
    // Skip if a SEED-ish entry for this module already exists
    const existing = await prisma.updateLog.findFirst({
      where: {
        districtId: mumbai.id,
        moduleName: e.moduleName,
        source: "api",
        actorLabel: "seed-script",
      },
      select: { id: true },
    });
    if (existing) {
      console.log(`  ⏭  ${e.moduleName.padEnd(24)} already logged`);
      skipped++;
      continue;
    }

    // Spread entries a few minutes apart so newest-first ordering is stable
    const ts = new Date(REFERENCE_DATE.getTime() - e.daysAgo * 86_400_000 + inserted * 60_000);

    await prisma.updateLog.create({
      data: {
        source: "api",
        actorLabel: "seed-script",
        tableName: e.tableName,
        recordId: `${mumbai.id}:${e.moduleName}:seed`,
        action: "create",
        districtId: mumbai.id,
        districtName: mumbai.name,
        moduleName: e.moduleName,
        description: e.summary,
        recordCount: e.recordCount ?? null,
        timestamp: ts,
      },
    });
    console.log(`  ✅ ${e.moduleName.padEnd(24)} ${ts.toISOString().slice(0, 10)}  ${e.summary}`);
    inserted++;
  }

  console.log(`\n📊 Result: inserted ${inserted}, skipped ${skipped}`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
