/**
 * Global trends scraper
 * Aggregates module-wise global headlines from Google News + major RSS feeds.
 */
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { classifyModule } from "@/scraper/jobs/news";
import type { ScraperResult } from "@/scraper/types";

type SourceConfig = {
  source: string;
  moduleHint: string;
  url: string;
};

type TrendRecord = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  targetModule: string;
};

const SOURCES: SourceConfig[] = [
  {
    source: "Google News",
    moduleHint: "crops",
    url: "https://news.google.com/rss/search?q=global%20agriculture%20market&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "Google News",
    moduleHint: "weather",
    url: "https://news.google.com/rss/search?q=global%20extreme%20weather&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "Google News",
    moduleHint: "water",
    url: "https://news.google.com/rss/search?q=global%20water%20crisis&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "Google News",
    moduleHint: "power",
    url: "https://news.google.com/rss/search?q=global%20power%20grid%20energy&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "BBC World",
    moduleHint: "news",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    source: "Reuters World",
    moduleHint: "news",
    url: "https://feeds.reuters.com/Reuters/worldNews",
  },
  {
    source: "CNBC World",
    moduleHint: "finance",
    url: "https://www.cnbc.com/id/100727362/device/rss/rss.html",
  },
  {
    source: "WHO News",
    moduleHint: "health",
    url: "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml",
  },
  {
    source: "Al Jazeera English",
    moduleHint: "news",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
  },
  {
    source: "The Hindu",
    moduleHint: "news",
    url: "https://www.thehindu.com/feeder/default.rss",
  },
  {
    source: "Times of India",
    moduleHint: "news",
    url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  },
  {
    source: "Bloomberg",
    moduleHint: "finance",
    url: "https://feeds.bloomberg.com/markets/news.rss",
  },
  {
    source: "Google News (Infrastructure)",
    moduleHint: "infrastructure",
    url: "https://news.google.com/rss/search?q=India+infrastructure+rail+highway+bridge&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "WHO SEARO",
    moduleHint: "health",
    url: "https://www.who.int/southeastasia/news/rss",
  },
  {
    source: "Google News (Weather)",
    moduleHint: "weather",
    url: "https://news.google.com/rss/search?q=India+IMD+weather+monsoon+forecast&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "UN News",
    moduleHint: "water",
    url: "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml",
  },
  {
    source: "Google News (Transport)",
    moduleHint: "transport",
    url: "https://news.google.com/rss/search?q=global+aviation+rail+shipping+logistics&hl=en-IN&gl=IN&ceid=IN:en",
  },
];

function parseDate(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function isFresh(publishedAt: Date, maxAgeDays = 7): boolean {
  const age = Date.now() - publishedAt.getTime();
  return age >= 0 && age <= maxAgeDays * 86_400_000;
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

async function fetchRss(source: SourceConfig): Promise<TrendRecord[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "JanaDhristi Global Trends Aggregator" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  return $("item")
    .toArray()
    .map((item) => {
      const title = $(item).find("title").text().replace(/ - .*$/, "").trim();
      const url = normalizeUrl($(item).find("link").text().trim() || $(item).find("guid").text().trim());
      const summary = $(item).find("description").text().replace(/<[^>]+>/g, "").trim();
      const publishedAt = parseDate($(item).find("pubDate").text().trim());
      const classified = classifyModule(title);
      return {
        title,
        summary,
        url,
        source: source.source,
        publishedAt,
        targetModule: classified && classified !== "news" ? classified : source.moduleHint,
      } satisfies TrendRecord;
    })
    .filter((x) => x.title.length > 10 && x.url && isFresh(x.publishedAt))
    .slice(0, 20);
}

export async function scrapeGlobalTrends(): Promise<ScraperResult> {
  try {
    const fetched = await Promise.allSettled(SOURCES.map((s) => fetchRss(s)));
    const rows: TrendRecord[] = [];
    for (const r of fetched) {
      if (r.status === "fulfilled") rows.push(...r.value);
    }

    const seen = new Set<string>();
    let inserted = 0;
    for (const row of rows) {
      const dedupKey = `${row.targetModule}:${row.title.toLowerCase().slice(0, 80)}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const exists = await prisma.globalTrendItem.findFirst({
        where: {
          OR: [{ url: row.url }, { title: row.title, source: row.source }],
          publishedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
        },
        select: { id: true },
      });
      if (exists) continue;

      await prisma.globalTrendItem.create({
        data: {
          title: row.title,
          summary: row.summary || null,
          url: row.url,
          source: row.source,
          targetModule: row.targetModule,
          category: row.targetModule,
          region: "global",
          publishedAt: row.publishedAt,
          fetchedAt: new Date(),
        },
      });
      inserted++;
    }

    // Retain only last 200 global items.
    const oldRows = await prisma.globalTrendItem.findMany({
      orderBy: { publishedAt: "desc" },
      skip: 200,
      select: { id: true },
    });
    if (oldRows.length > 0) {
      await prisma.globalTrendItem.deleteMany({ where: { id: { in: oldRows.map((x) => x.id) } } });
    }

    return { success: true, recordsNew: inserted, recordsUpdated: 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
