/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Master Scraper Scheduler
// Run with: npm run scraper
// Keeps running as a background process (PM2 compatible)
// ═══════════════════════════════════════════════════════════
import dotenv from "dotenv";
import cron from "node-cron";
import { prisma } from "@/lib/db";
import { cacheKey } from "@/lib/cache";
import redis from "@/lib/redis";
import { makeLogger, writeLog } from "./logger";
import { JobContext, ScraperJob } from "./types";

// ── Core live scrapers ────────────────────────────────────
import { scrapeWeather } from "./jobs/weather";
import { scrapeCrops } from "./jobs/crops";
import { scrapeNews } from "./jobs/news";
import { scrapeDams } from "./jobs/dams";
import { scrapePower } from "./jobs/power";
// ── Daily scrapers ────────────────────────────────────────
import { scrapeMGNREGA } from "./jobs/mgnrega";
import { scrapePolice } from "./jobs/police";
import { scrapeInfrastructure } from "./jobs/infrastructure";
// ── Weekly scrapers ───────────────────────────────────────
import { scrapeJJM } from "./jobs/jjm";
import { scrapeHousing } from "./jobs/housing";
import { scrapeSchools } from "./jobs/schools";
// ── Monthly scrapers ──────────────────────────────────────
import { scrapeFinance } from "./jobs/finance";
import { scrapeTransport } from "./jobs/transport";
import { scrapeSchemes } from "./jobs/schemes";
import { scrapeSoil } from "./jobs/soil";
// ── Weekly scrapers (continued) ──────────────────────────
import { scrapeBudget } from "./jobs/budget";
// ── 12-hour scrapers ─────────────────────────────────────
import { scrapeExams } from "./jobs/exams";

// Prefer .env.local for local development, then fall back to .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

// ── Fetch active districts from DB ───────────────────────
async function getActiveDistricts(): Promise<Array<{ slug: string; name: string; stateSlug: string; stateName: string }>> {
  const rows = await prisma.district.findMany({
    where: { active: true },
    select: { slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    stateSlug: (r as { state?: { slug: string } }).state?.slug ?? "karnataka",
    stateName: (r as { state?: { name: string } }).state?.name ?? "Karnataka",
  }));
}

// ── Cache invalidation helper ─────────────────────────────
async function invalidateCache(districtSlug: string, modules: string[]) {
  if (!redis) return;
  for (const mod of modules) {
    const key = cacheKey(districtSlug, mod);
    await redis.del(key);
  }
}

// ── Run a single job with logging ─────────────────────────
async function runJob(
  jobName: string,
  job: ScraperJob,
  ctx: JobContext,
  cacheModules: string[]
) {
  const startedAt = new Date();
  const { log } = makeLogger(jobName);
  ctx.log = log;

  log(`Starting job: ${jobName} for district: ${ctx.districtSlug}`);
  let result;
  try {
    result = await job(ctx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }

  log(`Completed: success=${result.success} new=${result.recordsNew} updated=${result.recordsUpdated}`);
  await writeLog(jobName, startedAt, result);

  if (result.success && cacheModules.length > 0) {
    await invalidateCache(ctx.districtSlug, cacheModules);
    log(`Cache invalidated: ${cacheModules.join(", ")}`);
  }
}

// ── Resolve district IDs ──────────────────────────────────
async function getDistrictContext(slug: string, name: string, stateSlug: string, stateName: string): Promise<JobContext | null> {
  const district = await prisma.district.findFirst({
    where: { slug },
    select: { id: true },
  });
  if (!district) {
    console.error(`[Scheduler] District not found: ${slug}`);
    return null;
  }
  return {
    districtSlug: slug,
    districtId: district.id,
    districtName: name,
    stateSlug,
    stateName,
    log: console.log,
  };
}

// ── Schedule definitions ──────────────────────────────────
async function scheduleJobs() {
  const activeDistricts = await getActiveDistricts();
  for (const { slug, name, stateSlug, stateName } of activeDistricts) {
    const ctx = await getDistrictContext(slug, name, stateSlug, stateName);
    if (!ctx) continue;

    // ── Every 5 min: Weather ──────────────────────────────
    cron.schedule("*/5 * * * *", () => runJob("weather", scrapeWeather, ctx, ["weather", "overview"]));

    // ── Every 15 min (6AM-8PM IST): Crop Prices ───────────
    cron.schedule(
      "*/15 6-20 * * *",
      () => runJob("crops", scrapeCrops, ctx, ["crops", "overview"]),
      { timezone: "Asia/Kolkata" }
    );

    // ── Every 15 min: Power outages ───────────────────────
    cron.schedule("*/15 * * * *", () => runJob("power", scrapePower, ctx, ["power"]));

    // ── Every 30 min: Dam levels ──────────────────────────
    cron.schedule("*/30 * * * *", () => runJob("dams", scrapeDams, ctx, ["water", "overview"]));

    // ── Every 1 hour: News ────────────────────────────────
    cron.schedule("0 * * * *", () => runJob("news", scrapeNews, ctx, ["news"]));

    // ── Every 6 hours: Police data ────────────────────────
    cron.schedule("0 */6 * * *", () => runJob("police", scrapePolice, ctx, ["police"]));

    // ── Every 12 hours: Infrastructure ───────────────────
    cron.schedule("0 */12 * * *", () => runJob("infrastructure", scrapeInfrastructure, ctx, ["infrastructure"]));

    // ── Every 12 hours: Exams & Jobs ─────────────────────
    cron.schedule("0 */12 * * *", () => runJob("exams", scrapeExams, ctx, ["exams"]));

    // ── Daily 4 AM: MGNREGA / Panchayat ──────────────────
    cron.schedule("0 4 * * *", () => runJob("mgnrega", scrapeMGNREGA, ctx, ["gram-panchayat"]));

    // ── Weekly Sunday 3 AM: JJM, Housing, Schools ────────
    cron.schedule("0 3 * * 0", async () => {
      await runJob("jjm", scrapeJJM, ctx, ["jjm"]);
      await runJob("housing", scrapeHousing, ctx, ["housing"]);
      await runJob("schools", scrapeSchools, ctx, ["schools"]);
    });

    // ── Monthly 1st, 5 AM: Finance, Transport, Schemes ───
    cron.schedule("0 5 1 * *", async () => {
      await runJob("finance", scrapeFinance, ctx, ["finance"]);
      await runJob("transport", scrapeTransport, ctx, ["transport"]);
      await runJob("schemes", scrapeSchemes, ctx, ["schemes"]);
    });

    // ── Weekly Monday 6 AM: Budget collection ─────────────
    cron.schedule("0 6 * * 1", () => runJob("budget", scrapeBudget, ctx, ["finance"]));

    // ── Monthly 15th, 3 AM: Soil ─────────────────────────
    cron.schedule("0 3 15 * *", async () => {
      await runJob("soil", scrapeSoil, ctx, ["farm"]);
    });

    console.log(`[Scheduler] Scheduled all jobs for district: ${slug}`);
  }
}

// ── Startup ────────────────────────────────────────────────
async function main() {
  console.log("[Scheduler] JanaDhristi Scraper Service starting...");

  await scheduleJobs();

  // Run critical live jobs immediately on startup
  const activeDistricts = await getActiveDistricts();
  for (const { slug, name, stateSlug, stateName } of activeDistricts) {
    const ctx = await getDistrictContext(slug, name, stateSlug, stateName);
    if (!ctx) continue;

    console.log(`[Scheduler] Running initial jobs for ${slug}...`);
    await runJob("weather", scrapeWeather, ctx, ["weather", "overview"]);
    await runJob("crops", scrapeCrops, ctx, ["crops", "overview"]);
    await runJob("power", scrapePower, ctx, ["power"]);
    await runJob("news", scrapeNews, ctx, ["news"]);
    await runJob("exams", scrapeExams, ctx, ["exams"]);
  }

  console.log("[Scheduler] All cron jobs scheduled. Running indefinitely...");
  process.on("SIGINT", async () => {
    console.log("[Scheduler] Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    console.log("[Scheduler] Terminating...");
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[Scheduler] Fatal error:", err);
  process.exit(1);
});
