// ═══════════════════════════════════════════════════════════
// ONE-TIME Script: Trigger scrapers + AI insights for 4 new districts
// Usage: npx tsx scripts/trigger-new-districts.ts
// Districts: new-delhi, mumbai, kolkata, chennai
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { scrapeWeather } from "../src/scraper/jobs/weather";
import { scrapeCrops } from "../src/scraper/jobs/crops";
import { scrapeNews } from "../src/scraper/jobs/news";
import { MODULE_INSIGHT_CONFIGS } from "../src/lib/insight-config";
import { generateInsight } from "../src/lib/insight-generator";
import { calculateDistrictHealthScore } from "../src/lib/health-score";
import redis from "../src/lib/redis";
import type { JobContext } from "../src/scraper/types";

const TARGET_SLUGS = ["new-delhi", "mumbai", "kolkata", "chennai"] as const;

// All modules whose cache keys should be cleared
const CACHE_MODULES = [
  "overview", "leaders", "budget", "crops", "weather", "water", "news",
  "alerts", "infrastructure", "schemes", "health", "police", "elections",
  "transport", "power", "education", "gram-panchayat", "rti", "courts",
  "industries", "sugar-factory", "soil", "housing", "jjm", "offices",
  "population", "famous-personalities", "citizen-corner", "data-sources",
  "health-score", "insights",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeContext(d: { id: string; slug: string; name: string; state: { slug: string; name: string } }): JobContext {
  return {
    districtSlug: d.slug,
    districtId: d.id,
    districtName: d.name,
    stateSlug: d.state.slug,
    stateName: d.state.name,
    log: (msg: string) => console.log(`  [${d.slug}] ${msg}`),
  };
}

async function main() {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  ForThePeople.in — New District Data Trigger");
  console.log("  Districts:", TARGET_SLUGS.join(", "));
  console.log("══════════════════════════════════════════════════\n");

  const districts = await prisma.district.findMany({
    where: { slug: { in: [...TARGET_SLUGS] } },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
  });

  if (districts.length === 0) {
    console.error("❌ No matching districts found in DB. Ensure these districts exist.");
    process.exit(1);
  }

  const found = districts.map((d) => d.slug);
  const missing = TARGET_SLUGS.filter((s) => !found.includes(s));
  if (missing.length > 0) {
    console.warn(`⚠️  Missing districts (will skip): ${missing.join(", ")}`);
  }
  console.log(`✓ Found ${districts.length} districts\n`);

  const startTime = Date.now();
  const results: Record<string, { weather: boolean; crops: boolean; news: boolean; insights: number; healthScore: boolean; cacheCleared: number }> = {};

  for (const district of districts) {
    const ctx = makeContext(district);
    console.log(`\n── ${district.name} (${district.state.name}) [${district.slug}] ──`);
    results[district.slug] = { weather: false, crops: false, news: false, insights: 0, healthScore: false, cacheCleared: 0 };

    // 1. Weather
    console.log("  ⏳ Fetching weather...");
    const weatherResult = await scrapeWeather(ctx);
    results[district.slug].weather = weatherResult.success;
    console.log(`  ${weatherResult.success ? "✓" : "✗"} Weather: ${weatherResult.success ? `${weatherResult.recordsNew} new` : weatherResult.error}`);

    // 2. Crop Prices
    console.log("  ⏳ Fetching crop prices...");
    const cropsResult = await scrapeCrops(ctx);
    results[district.slug].crops = cropsResult.success;
    console.log(`  ${cropsResult.success ? "✓" : "✗"} Crops: ${cropsResult.success ? `${cropsResult.recordsNew} new` : cropsResult.error}`);

    // 3. News
    console.log("  ⏳ Fetching news...");
    const newsResult = await scrapeNews(ctx);
    results[district.slug].news = newsResult.success;
    console.log(`  ${newsResult.success ? "✓" : "✗"} News: ${newsResult.success ? `${newsResult.recordsNew} new` : newsResult.error}`);

    // 4. AI Insights (all 29 modules)
    console.log(`  ⏳ Generating ${MODULE_INSIGHT_CONFIGS.length} AI insights...`);
    let insightOk = 0;
    for (const config of MODULE_INSIGHT_CONFIGS) {
      process.stdout.write(`    ⏳ ${config.module}...`);
      const ok = await generateInsight(
        config,
        district.id,
        district.slug,
        district.name,
        district.state.slug,
        district.state.name
      );
      if (ok) {
        insightOk++;
        process.stdout.write(" ✓\n");
      } else {
        process.stdout.write(" ✗\n");
      }
      await sleep(2000); // Rate limit
    }
    results[district.slug].insights = insightOk;
    console.log(`  ✓ Insights: ${insightOk}/${MODULE_INSIGHT_CONFIGS.length} succeeded`);

    // 5. Health Score
    console.log("  ⏳ Calculating health score...");
    try {
      await calculateDistrictHealthScore(district.id);
      results[district.slug].healthScore = true;
      console.log("  ✓ Health score calculated");
    } catch (err) {
      console.log(`  ✗ Health score failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 6. Clear Redis cache
    if (redis) {
      console.log("  ⏳ Clearing Redis cache...");
      let cleared = 0;
      for (const mod of CACHE_MODULES) {
        const key = `ftp:${district.slug}:${mod}`;
        try {
          await redis.del(key);
          cleared++;
        } catch {
          // non-fatal
        }
      }
      results[district.slug].cacheCleared = cleared;
      console.log(`  ✓ Cleared ${cleared} cache keys`);
    } else {
      console.log("  ⏭ Redis not configured — skipping cache clear");
    }
  }

  // Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log("\n══════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("══════════════════════════════════════════════════");
  for (const [slug, r] of Object.entries(results)) {
    console.log(`  ${slug}:`);
    console.log(`    Weather: ${r.weather ? "✓" : "✗"}  |  Crops: ${r.crops ? "✓" : "✗"}  |  News: ${r.news ? "✓" : "✗"}`);
    console.log(`    Insights: ${r.insights}/${MODULE_INSIGHT_CONFIGS.length}  |  Health: ${r.healthScore ? "✓" : "✗"}  |  Cache cleared: ${r.cacheCleared}`);
  }
  console.log(`\n  Done in ${duration}s\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
