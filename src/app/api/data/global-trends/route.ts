/**
 * Global trends API
 * Returns module-wise global headlines sourced by scrape-global-trends cron.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:global-trends:v1";

type GlobalTrendItem = {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  publishedAt: string;
};

type GlobalTrendBucket = {
  module: string;
  label: string;
  items: GlobalTrendItem[];
};

const ORDER = ["crops", "weather", "water", "power", "health", "infrastructure", "finance", "transport", "news"];

function labelFromModule(module: string): string {
  return module
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function GET() {
  const cached = await cacheGet<{ modules: GlobalTrendBucket[]; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const rows = await prisma.globalTrendItem.findMany({
      where: { publishedAt: { gte: since } },
      orderBy: { publishedAt: "desc" },
      take: 180,
      select: {
        id: true,
        title: true,
        summary: true,
        url: true,
        source: true,
        publishedAt: true,
        targetModule: true,
      },
    });

    const buckets = new Map<string, GlobalTrendItem[]>();
    for (const row of rows) {
      const key = (row.targetModule || "news").toLowerCase();
      const list = buckets.get(key) ?? [];
      if (list.length >= 5) continue;
      list.push({
        id: row.id,
        title: row.title,
        summary: row.summary ?? null,
        url: row.url,
        source: row.source,
        publishedAt: row.publishedAt.toISOString(),
      });
      buckets.set(key, list);
    }

    const modules: GlobalTrendBucket[] = [];
    const used = new Set<string>();
    for (const key of ORDER) {
      const items = buckets.get(key);
      if (!items?.length) continue;
      modules.push({ module: key, label: labelFromModule(key), items });
      used.add(key);
    }
    for (const [key, items] of buckets.entries()) {
      if (used.has(key) || !items.length) continue;
      modules.push({ module: key, label: labelFromModule(key), items });
    }

    const payload = { modules, fromCache: false };
    await cacheSet(CACHE_KEY, payload, 300);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[global-trends]", err);
    return NextResponse.json({ modules: [], fromCache: false, error: true });
  }
}
