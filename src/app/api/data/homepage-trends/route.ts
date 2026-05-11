/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { HOME_AGGREGATE_TTL_SEC } from "@/lib/module-freshness";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";

const CACHE_KEY = "ftp:homepage-trends:v2";

/** Preferred column order (subset of module slugs + general). */
const TREND_SECTOR_ORDER: string[] = [
  "infrastructure",
  "crops",
  "weather",
  "water",
  "police",
  "news",
  "health",
  "schemes",
  "power",
  "finance",
  "transport",
  "schools",
  "leadership",
  "elections",
  "alerts",
  "general",
];

function normalizeSectorKey(targetModule: string | null, category: string | null): string {
  const raw = (targetModule ?? category ?? "general").trim().toLowerCase();
  if (!raw) return "general";
  return raw.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "general";
}

function sectorLabel(slug: string): string {
  const m = SIDEBAR_MODULES.find((s) => s.slug === slug);
  if (m) return m.label;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type TrendItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  districtSlug: string;
  stateSlug: string;
};

export type TrendSector = {
  slug: string;
  label: string;
  items: TrendItem[];
};

export async function GET() {
  const cached = await cacheGet<{ sectors: TrendSector[]; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const activeDistricts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, state: { select: { slug: true } } },
    });
    const idSet = new Set(activeDistricts.map((d) => d.id));
    const idToSlug = new Map(activeDistricts.map((d) => [d.id, { districtSlug: d.slug, stateSlug: d.state.slug }]));

    if (activeDistricts.length === 0) {
      const body = { sectors: [] as TrendSector[], fromCache: false };
      await cacheSet(CACHE_KEY, body, HOME_AGGREGATE_TTL_SEC);
      return NextResponse.json(body);
    }

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const rows = await prisma.newsItem.findMany({
      where: {
        districtId: { in: activeDistricts.map((d) => d.id) },
        publishedAt: { gte: since },
      },
      orderBy: { publishedAt: "desc" },
      take: 120,
      select: {
        id: true,
        title: true,
        source: true,
        publishedAt: true,
        url: true,
        targetModule: true,
        category: true,
        districtId: true,
      },
    });

    const bucket = new Map<string, TrendItem[]>();
    for (const r of rows) {
      if (!r.districtId || !idSet.has(r.districtId)) continue;
      const loc = idToSlug.get(r.districtId);
      if (!loc) continue;
      const key = normalizeSectorKey(r.targetModule, r.category);
      const item: TrendItem = {
        id: r.id,
        title: r.title,
        source: r.source,
        publishedAt: r.publishedAt.toISOString(),
        url: r.url,
        districtSlug: loc.districtSlug,
        stateSlug: loc.stateSlug,
      };
      const list = bucket.get(key) ?? [];
      if (list.length >= 5) continue;
      list.push(item);
      bucket.set(key, list);
    }

    const seen = new Set<string>();
    const sectors: TrendSector[] = [];

    for (const slug of TREND_SECTOR_ORDER) {
      const items = bucket.get(slug);
      if (!items?.length) continue;
      seen.add(slug);
      sectors.push({ slug, label: sectorLabel(slug), items });
    }

    const rest = [...bucket.keys()].filter((k) => !seen.has(k)).sort();
    for (const slug of rest) {
      const items = bucket.get(slug);
      if (!items?.length) continue;
      sectors.push({ slug, label: sectorLabel(slug), items });
    }

    const body = { sectors, fromCache: false };
    await cacheSet(CACHE_KEY, body, HOME_AGGREGATE_TTL_SEC);
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${HOME_AGGREGATE_TTL_SEC}, stale-while-revalidate=45`,
      },
    });
  } catch (err) {
    console.error("[homepage-trends]", err);
    return NextResponse.json({ sectors: [], fromCache: false, error: true });
  }
}
