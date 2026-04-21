// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Remaining Telangana Districts
// Run this ONLY after verifying Hyderabad works perfectly.
//
// Usage: npx tsx scripts/activate-telangana-districts.ts
//        npx tsx scripts/activate-telangana-districts.ts warangal
//
// After running:
//   1. Update src/lib/constants/districts.ts → set activated district active: true
//   2. Seed data for the newly activated district
//   3. git commit + git push to deploy
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TELANGANA_INACTIVE_SLUGS = [
  "warangal",
  "nizamabad",
  "karimnagar",
  "khammam",
];

async function main() {
  console.log("🔓 Activating Telangana districts...\n");

  const telangana = await prisma.state.findUnique({ where: { slug: "telangana" } });
  if (!telangana) throw new Error("Telangana not found. Run seed-hierarchy.ts first.");

  const targetSlug = process.argv[2]; // optional: activate specific district
  const slugs = targetSlug ? [targetSlug] : TELANGANA_INACTIVE_SLUGS;
  let activated = 0;

  for (const slug of slugs) {
    const district = await prisma.district.findFirst({
      where: { slug, stateId: telangana.id },
    });
    if (!district) { console.log(`  ⚠️  ${slug} — not found`); continue; }
    if (district.active) { console.log(`  ✓ ${district.name} — already active`); continue; }

    await prisma.district.update({ where: { id: district.id }, data: { active: true } });
    console.log(`  ✅ ${district.name} — ACTIVATED`);
    activated++;
  }

  console.log(`\n🎉 Done! Activated ${activated} districts.`);
  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Edit src/lib/constants/districts.ts → set activated district active: true");
  console.log("  2. Seed data for the district");
  console.log("  3. git add -A && git commit && git push origin main");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
