// Clear all insights and regenerate fresh
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { MODULE_INSIGHT_CONFIGS } from "../src/lib/insight-config";
import { generateInsight } from "../src/lib/insight-generator";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // Clear all existing insights
  const deleted = await prisma.aIModuleInsight.deleteMany({});
  console.log(`\n🗑️  Cleared ${deleted.count} old insights\n`);

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
  });

  console.log(`🚀 Generating insights: ${districts.length} districts × ${MODULE_INSIGHT_CONFIGS.length} modules`);
  console.log(`   Total: ${districts.length * MODULE_INSIGHT_CONFIGS.length}\n`);

  let succeeded = 0;
  let failed = 0;

  for (const district of districts) {
    console.log(`\n── ${district.name} (${district.state.name}) ──`);
    for (const config of MODULE_INSIGHT_CONFIGS) {
      process.stdout.write(`  ⏳ ${config.module}...`);
      const ok = await generateInsight(
        config,
        district.id,
        district.slug,
        district.name,
        district.state.slug,
        district.state.name
      );
      if (ok) { process.stdout.write(` ✓\n`); succeeded++; }
      else { process.stdout.write(` ✗\n`); failed++; }
      await sleep(2000);
    }
  }

  console.log(`\n✅ Done: ${succeeded} succeeded, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
