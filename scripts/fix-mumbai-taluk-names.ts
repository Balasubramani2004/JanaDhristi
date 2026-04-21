/**
 * ForThePeople.in — Mumbai taluk data fix (April 2026)
 * Run: npx tsx scripts/fix-mumbai-taluk-names.ts
 *
 * Fixes:
 * 1. nameLocal was seeded in Kannada on some Mumbai taluks; Mumbai is in
 *    Maharashtra, so nameLocal must be Marathi (Devanagari).
 * 2. population and area were 0 / null on all Mumbai taluks — seed
 *    approximate zone/ward-level values.
 *
 * Data notes:
 *   Source: BMC Ward-wise population estimates (approximate).
 *   Exact census data at ward level is not available — using BMC estimates
 *   and reasonable aggregations for the 13 administrative zones.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../src/lib/update-log";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface TalukFix {
  name: string;          // exact English name to match against DB
  nameLocal: string;     // Marathi (Devanagari)
  population: number;    // approximate (BMC estimates)
  area: number;          // approximate km²
}

// Source: BMC Ward-wise population estimates (approximate).
// Exact census data at ward level is not available — using BMC estimates.
const MUMBAI_TALUKS: TalukFix[] = [
  { name: "Andheri",         nameLocal: "अंधेरी",      population: 2_600_000, area: 71 },
  { name: "Bandra",          nameLocal: "वांद्रे",     population: 1_100_000, area: 24 },
  { name: "Borivali",        nameLocal: "बोरीवली",     population: 1_800_000, area: 65 },
  { name: "Colaba",          nameLocal: "कुलाबा",      population:   150_000, area:  8 },
  { name: "Dadar",           nameLocal: "दादर",        population:   700_000, area: 12 },
  { name: "Eastern Suburbs", nameLocal: "पूर्व उपनगर", population: 1_200_000, area: 45 },
  { name: "Fort/Town",       nameLocal: "फोर्ट/टाउन",  population:   200_000, area:  7 },
  { name: "Harbour Zone",    nameLocal: "हार्बर झोन",  population:   800_000, area: 40 },
  { name: "Kurla",           nameLocal: "कुर्ला",      population: 1_500_000, area: 38 },
  { name: "Malad",           nameLocal: "मालाड",       population: 1_200_000, area: 30 },
  { name: "North Mumbai",    nameLocal: "उत्तर मुंबई", population:   900_000, area: 45 },
  { name: "South Mumbai",    nameLocal: "दक्षिण मुंबई", population:   600_000, area: 30 },
  { name: "Western Suburbs", nameLocal: "पश्चिम उपनगर", population: 1_400_000, area: 55 },
];

async function main() {
  console.log("🛠  Mumbai taluk fix starting...\n");

  const mumbai = await prisma.district.findFirst({
    where: { slug: "mumbai" },
    select: { id: true, name: true },
  });
  if (!mumbai) {
    console.error("❌ Mumbai district not found in DB");
    return;
  }

  const existing = await prisma.taluk.findMany({
    where: { districtId: mumbai.id },
    select: { id: true, name: true, nameLocal: true, population: true, area: true },
  });
  console.log(`Found ${existing.length} Mumbai taluks in DB\n`);

  let updated = 0;
  let skipped = 0;

  for (const fix of MUMBAI_TALUKS) {
    // Match on exact name; fall back to case-insensitive search
    const row =
      existing.find((t) => t.name === fix.name) ??
      existing.find((t) => t.name.toLowerCase() === fix.name.toLowerCase());

    if (!row) {
      console.log(`  ⏭  ${fix.name.padEnd(20)} — not in DB, skipped`);
      skipped++;
      continue;
    }

    await prisma.taluk.update({
      where: { id: row.id },
      data: {
        nameLocal: fix.nameLocal,
        population: fix.population,
        area: fix.area,
      },
    });
    console.log(
      `  ✅ ${fix.name.padEnd(20)} → ${fix.nameLocal}  ·  pop ${fix.population.toLocaleString("en-IN").padStart(11)}  ·  ${fix.area} km²`
    );
    updated++;
  }

  console.log(`\n📊 Result: updated ${updated}, skipped ${skipped}`);

  // ── UpdateLog entry ──────────────────────────────────────
  await logUpdate({
    source: "api",
    actorLabel: "seed-script",
    tableName: "Taluk",
    recordId: mumbai.id,
    action: "update",
    districtId: mumbai.id,
    districtName: mumbai.name,
    moduleName: "map",
    description: "Fixed Mumbai taluka names to Marathi + seeded zone populations (BMC ward estimates)",
    recordCount: updated,
    details: {
      script: "fix-mumbai-taluk-names",
      date: "2026-04-14",
      sourceNote: "BMC Ward-wise population estimates (approximate)",
    },
  });

  console.log("📝 UpdateLog entry written");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
