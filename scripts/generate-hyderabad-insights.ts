/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Generate AI Insights for Hyderabad district only
// Usage: npx tsx scripts/generate-hyderabad-insights.ts
// This calls the same insight generator used by the cron job,
// but targets only Hyderabad to populate initial AI insight cards.
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { MODULE_INSIGHT_CONFIGS } from "../src/lib/insight-config";
import { generateInsight } from "../src/lib/insight-generator";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const district = await prisma.district.findFirst({
    where: { slug: "hyderabad", state: { slug: "telangana" } },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
  });

  if (!district) throw new Error("Hyderabad district not found");

  console.log(`\n🧠 Generating AI insights for ${district.name} (${district.state.name})`);
  console.log(`   Modules: ${MODULE_INSIGHT_CONFIGS.length}\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const config of MODULE_INSIGHT_CONFIGS) {
    // Check if a fresh insight already exists
    const existing = await prisma.aIModuleInsight.findUnique({
      where: { districtId_module: { districtId: district.id, module: config.module } },
      select: { expiresAt: true },
    });

    if (existing && existing.expiresAt > new Date()) {
      process.stdout.write(`  ⏭  ${config.module} (fresh)\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ⏳ ${config.module}...`);
    const ok = await generateInsight(
      config,
      district.id,
      district.slug,
      district.state.slug,
    );

    if (ok) {
      process.stdout.write(` ✓\n`);
      succeeded++;
    } else {
      process.stdout.write(` ✗ failed\n`);
      failed++;
    }

    await sleep(2000); // Rate limiting
  }

  console.log(`\n🎉 Done! Succeeded: ${succeeded}, Failed: ${failed}, Skipped: ${skipped}`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
