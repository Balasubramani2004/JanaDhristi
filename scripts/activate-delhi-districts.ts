// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Remaining Delhi Districts
// Run this ONLY after verifying New Delhi works perfectly.
//
// Usage: npx tsx scripts/activate-delhi-districts.ts
//
// What this does:
//   1. Sets active=true for all 10 inactive Delhi districts in DB
//   2. Logs which districts were activated
//   3. Does NOT touch New Delhi (already active)
//   4. Does NOT touch any Karnataka districts
//
// After running:
//   - Update src/lib/constants/districts.ts → set all Delhi districts active: true
//   - Update BLUEPRINT-UNIFIED.md and FORTHEPEOPLE-SKILL-UPDATED.md
//   - git commit + git push to deploy
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DELHI_INACTIVE_SLUGS = [
  "central-delhi",
  "north-delhi",
  "north-west-delhi",
  "north-east-delhi",
  "east-delhi",
  "south-delhi",
  "south-west-delhi",
  "south-east-delhi",
  "west-delhi",
  "shahdara",
];

async function main() {
  console.log("🔓 Activating remaining Delhi districts...\n");

  const delhi = await prisma.state.findUnique({ where: { slug: "delhi" } });
  if (!delhi) throw new Error("Delhi not found in DB. Run seed-hierarchy.ts first.");

  let activated = 0;

  for (const slug of DELHI_INACTIVE_SLUGS) {
    const district = await prisma.district.findFirst({
      where: { slug, stateId: delhi.id },
    });

    if (!district) {
      console.log(`  ⚠️  ${slug} — not found in DB, skipping`);
      continue;
    }

    if (district.active) {
      console.log(`  ✓ ${district.name} — already active`);
      continue;
    }

    await prisma.district.update({
      where: { id: district.id },
      data: { active: true },
    });

    console.log(`  ✅ ${district.name} — ACTIVATED`);
    activated++;
  }

  console.log(`\n🎉 Done! Activated ${activated} districts.`);
  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Edit src/lib/constants/districts.ts → set all Delhi districts active: true");
  console.log("  2. Update BLUEPRINT-UNIFIED.md (pilot districts count)");
  console.log("  3. Update FORTHEPEOPLE-SKILL-UPDATED.md (pilot districts count)");
  console.log("  4. Update README.md (currently live section)");
  console.log('  5. git add -A && git commit -m "feat: activate all 11 Delhi districts"');
  console.log("  6. git push origin main  ← THIS deploys to Vercel");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
