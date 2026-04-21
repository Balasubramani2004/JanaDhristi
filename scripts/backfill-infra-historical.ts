/**
 * JanaDhristi — Historical Google News RSS backfill for Infrastructure
 * Run examples:
 *   npx tsx scripts/backfill-infra-historical.ts --dry-run --limit 20
 *   npx tsx scripts/backfill-infra-historical.ts --district mumbai --limit 50
 *   npx tsx scripts/backfill-infra-historical.ts --limit 200
 *
 * Sweeps Google News RSS with date-bounded queries spanning 2021-H1
 * through 2026-H1 for each active district (plus a curated list of
 * district-specific project queries). For every article:
 *
 *   1. Dedupe: skip if URL already in NewsItem or InfraUpdate tables.
 *   2. Extract (extractInfraFromNews, free-tier AI).
 *   3. Verify (verifyInfraExtraction, free-tier AI, different prompt).
 *   4. Sync (syncInfraFromNews) if verified — upserts InfraProject +
 *      creates timeline InfraUpdate rows linked to the article URL.
 *
 * Cost guards:
 *   --limit N : max N AI extractions (default 200, hard cap 500)
 *   2s delay between RSS fetches, 30s backoff on 429
 *   Max 100 RSS fetches per run
 *   try/catch around every article — one failure never aborts the run
 */

import "./_env";
import * as cheerio from "cheerio";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractInfraFromNews, verifyInfraExtraction, syncInfraFromNews } from "../src/lib/infra-sync";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ── CLI ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagValue(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}
function strArg(flag: string): string | null {
  const i = args.indexOf(flag);
  return i < 0 ? null : (args[i + 1] ?? null);
}
const LIMIT = Math.max(1, Math.min(500, flagValue("--limit", 200)));
const DRY_RUN = args.includes("--dry-run");
const DISTRICT_SLUG = strArg("--district");
const MAX_RSS_FETCHES = 100;
const FETCH_DELAY_MS = 2000;
const RATE_LIMIT_BACKOFF_MS = 30_000;

// ── Per-district project queries ────────────────────────────
const DISTRICT_QUERIES: Record<string, string[]> = {
  mumbai: [
    "Mumbai Metro Line 3",
    "Mumbai Coastal Road",
    "MTHL Atal Setu",
    "Dharavi Redevelopment",
    "Bullet Train Mumbai Ahmedabad",
    "Goregaon Mulund Link",
  ],
  "bengaluru-urban": [
    "Bengaluru Metro Phase 2",
    "Suburban Rail Bengaluru",
    "Peripheral Ring Road Bengaluru",
    "NICE Road Bengaluru",
  ],
  hyderabad: [
    "Hyderabad Metro Rail",
    "Regional Ring Road Hyderabad",
    "Musi Riverfront",
  ],
  chennai: [
    "Chennai Metro Phase 2",
    "Chennai Peripheral Ring Road",
  ],
  "new-delhi": [
    "Delhi Metro Phase 4",
    "RRTS Namo Bharat",
    "Dwarka Expressway",
  ],
  kolkata: [
    "East-West Metro Kolkata",
    "Joka Metro Kolkata",
  ],
  mandya: [
    "KRS Dam renovation",
    "Mandya infrastructure",
  ],
  mysuru: [
    "Mysuru Ring Road",
    "Chamundi Hill development",
  ],
  lucknow: [
    "Lucknow Metro",
    "Gomti Riverfront",
  ],
};

// Generic district queries (template — {district} placeholder)
const GENERIC_QUERIES = [
  "{district} metro project",
  "{district} highway road construction",
  "{district} infrastructure project budget",
  "{district} railway station project",
  "{district} water supply project",
];

// ── Six-month date windows 2021-H1 … 2026-H1 ────────────────
function buildDateWindows(): Array<{ after: string; before: string; label: string }> {
  const windows: Array<{ after: string; before: string; label: string }> = [];
  for (let year = 2021; year <= 2026; year++) {
    windows.push({ after: `${year}-01-01`, before: `${year}-06-30`, label: `${year}H1` });
    if (year < 2026) {
      windows.push({ after: `${year}-07-01`, before: `${year}-12-31`, label: `${year}H2` });
    }
  }
  return windows;
}

// ── Helpers ─────────────────────────────────────────────────
async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function parseRSSDate(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function fetchRSSItemsDated(
  query: string,
  after: string,
  before: string
): Promise<Array<{ headline: string; url: string; source: string; publishedAt: Date }>> {
  const q = encodeURIComponent(`${query} after:${after} before:${before}`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "JanaDhristi backfill (citizen transparency)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item").toArray().map((item) => ({
    headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
    url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
    source: $(item).find("source").text().trim() || "Google News",
    publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
  }));
}

async function isAlreadyProcessed(url: string): Promise<boolean> {
  if (!url) return true;
  const [newsHit, updateHit] = await Promise.all([
    prisma.newsItem.findFirst({ where: { url }, select: { id: true } }),
    prisma.infraUpdate.findFirst({ where: { newsUrl: url }, select: { id: true } }),
  ]);
  return Boolean(newsHit || updateHit);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log(`📚 Historical infra backfill ${DRY_RUN ? "(DRY-RUN)" : ""} — limit=${LIMIT}, district=${DISTRICT_SLUG ?? "ALL"}\n`);

  const districts = DISTRICT_SLUG
    ? await prisma.district.findMany({ where: { slug: DISTRICT_SLUG, active: true }, select: { id: true, slug: true, name: true } })
    : await prisma.district.findMany({ where: { active: true }, select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } });

  if (districts.length === 0) {
    console.log("No active districts matched. Exiting.");
    return;
  }

  const windows = buildDateWindows();

  let rssFetches = 0;
  let aiCalls = 0;
  let articlesSeen = 0;
  let articlesSkippedDup = 0;
  let articlesSynced = 0;
  let articlesVerifyFail = 0;
  let articlesFailed = 0;

  const seenUrls = new Set<string>(); // in-run dedupe

  outer:
  for (const d of districts) {
    const projectQueries = DISTRICT_QUERIES[d.slug] ?? [];
    const genericQueries = GENERIC_QUERIES.map((q) => q.replace("{district}", d.name));
    const queries = [...projectQueries, ...genericQueries];

    console.log(`\n──────── [${d.slug}] ${queries.length} queries × ${windows.length} windows ────────`);

    for (const q of queries) {
      for (const w of windows) {
        if (rssFetches >= MAX_RSS_FETCHES) { console.log("  ⏸  RSS fetch cap reached"); break outer; }
        if (aiCalls >= LIMIT) { console.log("  ⏸  AI call cap reached"); break outer; }

        rssFetches++;
        let items: Awaited<ReturnType<typeof fetchRSSItemsDated>> = [];
        try {
          items = await fetchRSSItemsDated(q, w.after, w.before);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "RATE_LIMITED") {
            console.log(`    ⚠  429 on "${q}" / ${w.label} — backing off ${RATE_LIMIT_BACKOFF_MS / 1000}s`);
            await sleep(RATE_LIMIT_BACKOFF_MS);
            try { items = await fetchRSSItemsDated(q, w.after, w.before); } catch { /* give up on this slot */ }
          } else {
            console.log(`    ⚠  fetch failed "${q}" / ${w.label}: ${msg}`);
          }
        }

        if (items.length === 0) { await sleep(FETCH_DELAY_MS); continue; }
        console.log(`  [${d.slug}] "${q.slice(0, 40)}" / ${w.label} → ${items.length} items`);

        for (const item of items) {
          if (aiCalls >= LIMIT) break;
          articlesSeen++;
          if (!item.url || seenUrls.has(item.url)) { articlesSkippedDup++; continue; }
          seenUrls.add(item.url);
          if (await isAlreadyProcessed(item.url)) { articlesSkippedDup++; continue; }

          if (DRY_RUN) {
            console.log(`    👀 ${item.publishedAt.toISOString().slice(0, 10)} ${item.headline.slice(0, 70)}`);
            continue;
          }

          // Extract → Verify → Sync
          try {
            aiCalls++;
            const extraction = await extractInfraFromNews({
              title: item.headline,
              url: item.url,
              source: item.source,
              publishedAt: item.publishedAt,
            });
            if (!extraction || extraction.confidence < 0.5) { articlesVerifyFail++; continue; }

            aiCalls++;
            const verification = await verifyInfraExtraction({
              title: item.headline, url: item.url, source: item.source, publishedAt: item.publishedAt,
            }, extraction);
            const merged = verification.corrections ? { ...extraction, ...verification.corrections } : extraction;
            if (!verification.verified && merged.confidence < 0.85) { articlesVerifyFail++; continue; }

            const result = await syncInfraFromNews(
              merged,
              { title: item.headline, url: item.url, source: item.source, publishedAt: item.publishedAt },
              d.id,
              verification.verified
            );
            articlesSynced += result.timelineCreated;
            console.log(`    ✅ synced ${merged.shortName ?? merged.projectName.slice(0, 40)} · +${result.timelineCreated} timeline across ${result.projectsTouched} districts`);
          } catch (err) {
            articlesFailed++;
            console.error(`    ❌ ${item.headline.slice(0, 60)}: ${err instanceof Error ? err.message : err}`);
          }
        }

        await sleep(FETCH_DELAY_MS);
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────
  console.log(`\n📊 Historical backfill result ${DRY_RUN ? "(DRY-RUN)" : ""}`);
  console.log(`   RSS fetches      : ${rssFetches} / ${MAX_RSS_FETCHES}`);
  console.log(`   AI calls         : ${aiCalls} / ${LIMIT}`);
  console.log(`   articles seen    : ${articlesSeen}`);
  console.log(`   skipped (dup)    : ${articlesSkippedDup}`);
  console.log(`   verify failed    : ${articlesVerifyFail}`);
  console.log(`   sync failed      : ${articlesFailed}`);
  console.log(`   timeline added   : ${articlesSynced}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
