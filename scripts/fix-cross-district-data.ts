/**
 * ForThePeople.in — Cross-district data fixes
 * Run: npx tsx scripts/fix-cross-district-data.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Scheme description + eligibility updates (keyed by name substring match)
const SCHEME_UPDATES: Array<{ match: string; eligibility?: string; amount?: number }> = [
  // Central
  { match: "PM-KISAN", eligibility: "All land-holding farmer families", amount: 6000 },
  { match: "PMAY", eligibility: "EWS/LIG families without pucca house" },
  { match: "Ayushman Bharat", eligibility: "BPL families as per SECC data", amount: 500000 },
  { match: "Ujjwala", eligibility: "BPL women without LPG connection", amount: 1600 },
  // Telangana
  { match: "Aasara", eligibility: "Old age, widows, disabled, weavers, beedi workers", amount: 24192 },
  { match: "Kalyana Lakshmi", eligibility: "BPL families — marriage assistance for daughters", amount: 100116 },
  { match: "KCR Kit", eligibility: "Pregnant women delivering at government hospitals", amount: 12000 },
  { match: "Dharani", eligibility: "All Telangana land owners — online land records" },
  { match: "TS-iPASS", eligibility: "Industries seeking clearances in Telangana" },
  { match: "2BHK Housing", eligibility: "EWS families in Telangana without own house" },
  // UP
  { match: "Kanya Sumangala", eligibility: "Girl child — family income below ₹3 lakh/year", amount: 15000 },
  { match: "Abhyudaya", eligibility: "Students preparing for competitive exams (IAS/IPS/PCS/JEE/NEET)" },
  { match: "Berojgari Bhatta", eligibility: "Unemployed youth aged 21-25 with graduation", amount: 1500 },
  { match: "Samajwadi Pension", eligibility: "Old age (60+), widows, disabled persons" },
  { match: "One District One Product", eligibility: "MSME entrepreneurs in designated product categories" },
];

async function main() {
  console.log("🔧 Cross-district data fixes...\n");

  // ═══ 1. Update scheme eligibility + amounts ═══
  console.log("1. Updating scheme descriptions & eligibility...");
  let schemeUpdates = 0;
  for (const upd of SCHEME_UPDATES) {
    const schemes = await prisma.scheme.findMany({
      where: { name: { contains: upd.match } },
    });
    for (const s of schemes) {
      const data: Record<string, unknown> = {};
      if (upd.eligibility && !s.eligibility) data.eligibility = upd.eligibility;
      if (upd.amount && !s.amount) data.amount = upd.amount;
      if (Object.keys(data).length > 0) {
        await prisma.scheme.update({ where: { id: s.id }, data });
        schemeUpdates++;
      }
    }
  }
  console.log(`  ✓ Updated ${schemeUpdates} scheme records\n`);

  // ═══ 2. Seed Hyderabad PMAY-U housing data ═══
  console.log("2. Seeding Hyderabad housing data (PMAY-U)...");
  const telangana = await prisma.state.findUnique({ where: { slug: "telangana" } });
  if (telangana) {
    const hyderabad = await prisma.district.findFirst({
      where: { slug: "hyderabad", stateId: telangana.id },
    });
    if (hyderabad) {
      const housingCount = await prisma.housingScheme.count({ where: { districtId: hyderabad.id } });
      if (housingCount === 0) {
        await prisma.housingScheme.createMany({
          skipDuplicates: true,
          data: [
            {
              districtId: hyderabad.id,
              schemeName: "PMAY-U (Pradhan Mantri Awas Yojana - Urban)",
              fiscalYear: "2024-25",
              targetHouses: 25000,
              sanctioned: 22000,
              completed: 14500,
              inProgress: 7500,
              fundsAllocated: 15000000000,
              fundsReleased: 11000000000,
              fundsSpent: 8500000000,
              source: "AwaasSoft PMAY Dashboard (pmay-urban.gov.in) — estimated",
            },
            {
              districtId: hyderabad.id,
              schemeName: "Telangana 2BHK Housing Scheme",
              fiscalYear: "2024-25",
              targetHouses: 50000,
              sanctioned: 45000,
              completed: 28000,
              inProgress: 17000,
              fundsAllocated: 50000000000,
              fundsReleased: 35000000000,
              fundsSpent: 28000000000,
              source: "Telangana Housing Department (housing.telangana.gov.in) — estimated",
            },
          ],
        });
        console.log("  ✓ Hyderabad housing seeded (PMAY-U + 2BHK)\n");
      } else {
        console.log(`  ⏭ Housing already exists (${housingCount})\n`);
      }
    }
  }

  // ═══ 3. Quality audit — check gaps ═══
  console.log("3. Quality audit — checking data gaps...\n");
  const districts = await prisma.district.findMany({
    where: { active: true },
    include: { state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  for (const d of districts) {
    const [housing, schemes, pop, leaders, healthScore] = await Promise.all([
      prisma.housingScheme.count({ where: { districtId: d.id } }),
      prisma.scheme.findMany({ where: { districtId: d.id }, select: { name: true, eligibility: true } }),
      prisma.populationHistory.count({ where: { districtId: d.id } }),
      prisma.leader.findMany({ where: { districtId: d.id, name: { startsWith: "VERIFY" } }, select: { name: true, role: true } }),
      prisma.districtHealthScore.findFirst({ where: { districtId: d.id }, select: { grade: true } }),
    ]);

    const schemesNoElig = schemes.filter((s) => !s.eligibility).length;
    const issues: string[] = [];
    if (housing === 0) issues.push("housing=0");
    if (schemesNoElig > 0) issues.push(`${schemesNoElig} schemes without eligibility`);
    if (pop === 0) issues.push("no population history");
    if (leaders.length > 0) issues.push(`${leaders.length} VERIFY leaders`);
    if (!healthScore) issues.push("no health score");

    if (issues.length > 0) {
      console.log(`  ⚠ ${d.name} (${d.state.name}): ${issues.join(", ")}`);
    } else {
      console.log(`  ✓ ${d.name} (${d.state.name}): OK`);
    }
  }

  console.log("\n🎉 Cross-district fixes complete!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
