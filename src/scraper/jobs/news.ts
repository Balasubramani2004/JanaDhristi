/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// Job: News — Google News RSS feed
// Schedule: Every 1 hour
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { classifyArticleWithAI, executeNewsAction } from "@/lib/news-action-engine";
import { logUpdate } from "@/lib/update-log";

// Keyword-matcher categories that still benefit from AI-driven data extraction
// (because we act on them downstream — create Infrastructure projects, alerts,
// exam records, etc.). Purely informational categories skip the AI round-trip.
const ACTIONABLE_MODULES = [
  "infrastructure",
  "alerts",
  "exams",
  "staffing",
  "leaders",
  "police",
  "health",
  "power",
  "schemes",
];
import { JobContext, ScraperResult } from "../types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ["election", "mla", "mp", "bjp", "congress", "party", "minister", "vote", "rally"],
  development: ["project", "scheme", "fund", "tender", "launch", "inaugurate", "development"],
  agriculture: ["crop", "farmer", "agri", "harvest", "sugar", "paddy", "mandi", "market"],
  crime: ["arrest", "murder", "theft", "robbery", "fraud", "police", "fir", "accused"],
  health: ["hospital", "health", "doctor", "disease", "covid", "dengue", "treatment"],
  education: ["school", "college", "exam", "result", "student", "education", "teacher"],
  infrastructure: ["road", "bridge", "water", "power", "electricity", "construction", "nh"],
  weather: ["rain", "flood", "drought", "storm", "temperature", "weather"],
};

// NOTE: precedence matters — first match wins. "transport" sits ABOVE crops,
// police, and generic categories so that specific train/metro keywords like
// "vande bharat" or "mumbai local" win over incidental "agri"/"crime" mentions.
const MODULE_KEYWORDS: Array<[string, string[]]> = [
  ["leaders",        ["mla", "mp", "minister", "collector", "sp police", "deputy commissioner", "dc ", "elected", "appointment", "sworn in", "cabinet", "official"]],
  ["infrastructure", ["road", "bridge", "highway", "nh-", "overbridge", "underpass", "construction", "inaugurate", "flyover", "project"]],
  ["transport",      [
    // Core + existing
    "bus", "transport", "ksrtc", "railway", "metro", "taxi", "auto", "road accident", "traffic",
    // Rail services — named trains (these were being misclassified as crops)
    "vande bharat", "shatabdi", "rajdhani", "duronto", "tejas", "jan shatabdi",
    // Mumbai-specific suburban rail + buses
    "local train", "mumbai local", "suburban", "suburban rail", "wr local", "cr local",
    "best bus", "best undertaking", "monorail", "metro line",
    // Commuter / crowding — previously snagged by "police/crime"
    "commuter", "commuters", "overcrowding", "overcrowded", "stampede at station",
    // Generic rail
    "train", "platform", "station", "irctc",
  ]],
  ["budget",         ["budget", "fund", "crore", "lakh", "allocation", "grant", "expenditure", "revenue", "deficit", "treasury"]],
  ["water",          ["dam", "reservoir", "water level", "krishnaraja sagar", "krs", "kabini", "irrigation", "cauvery", "drinking water supply"]],
  ["crops",          ["crop", "farmer", "paddy", "sugarcane", "mandi price", "apmc", "harvest", "agri", "ragi", "tomato price", "onion price"]],
  ["weather",        ["rain", "flood", "drought", "cyclone", "storm", "temperature", "imd", "monsoon", "heatwave"]],
  ["police",         ["police", "arrest", "fir", "crime", "murder", "theft", "robbery", "accused", "case registered", "custody", "sp ", "ips officer"]],
  ["elections",      ["election", "vote", "polling", "candidate", "bjp", "congress", "jds", "bypoll", "constituency", "electoral"]],
  ["exams",          ["sslc", "puc", "cet", "neet", "jee", "hall ticket", "exam date", "board exam", "revaluation", "results declared", "exam centre", "competitive exam"]],
  ["education",      ["school", "college", "university", "exam", "result", "student", "teacher", "sylhet", "sslc", "puc result"]],
  ["health",         ["hospital", "health", "doctor", "disease", "dengue", "malaria", "covid", "vaccination", "primary health centre", "phc"]],
  ["schemes",        ["scheme", "yojana", "pmay", "mgnrega", "welfare", "beneficiary", "pension", "ration card", "anna bhagya"]],
  ["housing",        ["housing", "house", "flat", "apartment", "pmay", "slum", "eviction", "shelter"]],
  ["power",          ["power cut", "electricity", "outage", "load shedding", "substation", "bescom", "mescom", "voltage", "power supply"]],
  ["courts",         ["court", "hc order", "high court", "supreme court", "verdict", "judgment", "bail", "hearing", "legal"]],
  ["jjm",            ["jal jeevan", "jjm", "tap water", "household water connection", "piped water"]],
  ["gram-panchayat", ["panchayat", "gram sabha", "village council", "grama panchayati", "taluk panchayat", "zilla panchayat"]],
  ["alerts",         ["alert", "red alert", "orange alert", "warning", "emergency", "disaster", "rescue", "ndrf"]],
  ["sugar-factory",  ["sugar factory", "sugar mill", "sugarcane crushing", "mandya sugar", "mysore sugar"]],
  ["rti",            ["rti", "right to information", "transparency", "public information officer"]],
];

function categorize(headline: string): string {
  const lower = headline.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "general";
}

export function classifyModule(headline: string): string | null {
  const lower = headline.toLowerCase();
  for (const [module, keywords] of MODULE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return module;
  }
  return "news";
}

function parseRSSDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

// Reject articles older than maxAgeDays, future-dated, or from year < current-1
function isArticleFresh(publishedDate: Date, maxAgeDays = 3): boolean {
  const now = new Date();
  const ageMs = now.getTime() - publishedDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > maxAgeDays) return false;
  if (publishedDate > now) return false;
  if (publishedDate.getFullYear() < now.getFullYear() - 1) return false;
  return true;
}

// Dedup by first 5 significant words in title — catches same article via different URLs
async function isTitleDuplicate(
  title: string,
  districtId: string,
  seenTitleKeys: Set<string>
): Promise<boolean> {
  const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words = normalized.split(/\s+/).filter((w) => w.length > 3);
  const key = words.slice(0, 5).join(" ");
  if (!key) return false;
  if (seenTitleKeys.has(key)) return true;
  seenTitleKeys.add(key);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.newsItem.findFirst({
    where: {
      districtId,
      publishedAt: { gte: sevenDaysAgo },
      title: { contains: key, mode: "insensitive" },
    },
    select: { id: true },
  });
  return !!existing;
}

function buildQueries(districtSlug: string, stateName: string): string[] {
  const name = districtSlug.replace(/-/g, " ");
  const state = stateName.trim();
  return [
    `${name} ${state}`,
    `${name} district news`,
    `${name} ${state} latest`,
  ];
}

// Static RSS sources filtered by district name match
function buildStaticSources(districtName: string, stateName: string): Array<{ url: string; sourceName: string }> {
  return [
    { url: `https://www.thehindu.com/news/national/karnataka/feeder/default.rss`, sourceName: "The Hindu" },
    { url: `https://www.deccanherald.com/rss/karnataka.rss`, sourceName: "Deccan Herald" },
    { url: `https://news.google.com/rss/search?q=${encodeURIComponent(districtName + " " + stateName + " government")}&hl=en-IN&gl=IN&ceid=IN:en`, sourceName: "Google News" },
  ];
}

async function fetchStaticRSSItems(sourceUrl: string, sourceName: string, districtName: string): Promise<Array<{
  headline: string; url: string; summary: string; source: string; publishedAt: Date;
}>> {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "JanaDhristi News Aggregator (citizen transparency)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const districtLower = districtName.toLowerCase();

  return $("item").toArray()
    .map((item) => ({
      headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
      url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
      summary: $(item).find("description").text().replace(/<[^>]+>/g, "").slice(0, 300).trim(),
      source: sourceName,
      publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
    }))
    .filter((item) =>
      (item.headline.toLowerCase().includes(districtLower) ||
       item.summary.toLowerCase().includes(districtLower)) &&
      isArticleFresh(item.publishedAt)
    )
    .slice(0, 10);
}

async function fetchRSSItems(query: string): Promise<Array<{
  headline: string; url: string; summary: string; source: string; publishedAt: Date;
}>> {
  const encoded = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;

  const res = await fetch(rssUrl, {
    headers: { "User-Agent": "JanaDhristi News Aggregator (citizen transparency)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  return $("item").toArray().map((item) => ({
    headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
    url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
    summary: $(item).find("description").text().replace(/<[^>]+>/g, "").slice(0, 300).trim(),
    source: $(item).find("source").text().trim() || "Google News",
    publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
  })).filter((item) => isArticleFresh(item.publishedAt));
}

export async function scrapeNews(ctx: JobContext): Promise<ScraperResult> {
  try {
    const queries = buildQueries(ctx.districtSlug, ctx.stateName);
    const seenUrls = new Set<string>();
    const seenTitleKeys = new Set<string>();
    let newCount = 0;

    // Load existing URLs to avoid re-inserting
    const existingUrls = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId },
      select: { url: true },
    });
    existingUrls.forEach((n) => { if (n.url) seenUrls.add(n.url); });

    // Keyword-only classification in cron — no per-article AI calls.
    // AI classification is extremely slow when done sequentially (2-5s each),
    // causing cron timeouts. Keyword classifier covers >90% of articles;
    // the remainder are stored as "news" and can be AI-reclassified separately.
    async function saveItems(items: Array<{ headline: string; url: string; summary: string; source: string; publishedAt: Date }>, limit = 20) {
      for (const item of items.slice(0, limit)) {
        if (!item.headline || item.headline.length < 5) continue;
        if (!item.url) continue;
        if (seenUrls.has(item.url)) continue;
        if (!isArticleFresh(item.publishedAt)) continue;
        if (await isTitleDuplicate(item.headline, ctx.districtId, seenTitleKeys)) continue;
        seenUrls.add(item.url);

        const targetMod = classifyModule(item.headline) ?? "news";

        await prisma.newsItem.create({
          data: {
            districtId: ctx.districtId,
            title: item.headline,
            summary: item.summary || null,
            source: item.source,
            url: item.url,
            category: categorize(item.headline),
            publishedAt: item.publishedAt,
            targetModule: targetMod,
            moduleAction: null,
            classifiedBy: "keyword",
            classifiedAt: new Date(),
          },
        });

        // Fire-and-forget AI enrichment for actionable modules only — does NOT
        // block the scraper. If it fails, the record is already saved with keyword data.
        if (ACTIONABLE_MODULES.includes(targetMod)) {
          classifyArticleWithAI(item.headline, item.source, ctx.districtName, item.publishedAt)
            .then(async (aiResult) => {
              if (!aiResult || aiResult.confidence < 0.60) return;
              // Find the record we just created and update it with AI data
              const saved = await prisma.newsItem.findFirst({
                where: { districtId: ctx.districtId, url: item.url },
                select: { id: true },
              });
              if (!saved) return;
              await prisma.newsItem.update({
                where: { id: saved.id },
                data: {
                  targetModule: aiResult.targetModule,
                  moduleAction: aiResult.moduleAction || null,
                  classifiedBy: aiResult.provider,
                  classifiedAt: new Date(),
                },
              });
              if (aiResult.confidence >= 0.60) {
                executeNewsAction({
                  articleId: saved.id,
                  articleTitle: item.headline,
                  articleUrl: item.url,
                  districtId: ctx.districtId,
                  targetModule: aiResult.targetModule,
                  moduleAction: aiResult.moduleAction,
                  extractedData: aiResult.extractedData,
                  confidence: aiResult.confidence,
                }).catch(() => {});
              }
            })
            .catch(() => {});
        }

        newCount++;
      }
    }

    // Fetch all RSS sources in parallel (3 Google News queries + 3 static sources)
    const staticSources = buildStaticSources(ctx.districtName, ctx.stateName);

    const [queryResults, staticResults] = await Promise.all([
      Promise.allSettled(queries.map((q) => fetchRSSItems(q).catch(() => []))),
      Promise.allSettled(
        staticSources.map((src) =>
          fetchStaticRSSItems(src.url, src.sourceName, ctx.districtName).catch(() => [])
        )
      ),
    ]);

    for (const result of queryResults) {
      if (result.status === "fulfilled") {
        await saveItems(result.value, 15);
      }
    }
    for (const result of staticResults) {
      if (result.status === "fulfilled") {
        await saveItems(result.value, 10);
      }
    }

    // Keep only last 50 news items
    const old = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { publishedAt: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.newsItem.deleteMany({ where: { id: { in: old.map((n) => n.id) } } });
    }

    const summary = `News: ${newCount} new items across ${queries.length} queries`;
    ctx.log(summary);

    if (newCount > 0) {
      await logUpdate({
        source: "scraper",
        actorLabel: "cron",
        tableName: "NewsItem",
        recordId: `${ctx.districtId}:${Date.now()}`,
        action: "create",
        districtId: ctx.districtId,
        districtName: ctx.districtName,
        moduleName: "news",
        description: summary,
        recordCount: newCount,
      });
    }

    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
