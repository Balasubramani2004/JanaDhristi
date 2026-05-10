/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Homepage Stats API
// GET /api/data/homepage-stats
// Returns aggregated counts for hero stats bar
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { INDIA_STATES } from "@/lib/constants/districts";

const CACHE_KEY = "ftp:homepage-stats:v3";
const MODULES_PER_DISTRICT = SIDEBAR_MODULES.filter((m) => m.slug !== "map").length;
const TOTAL_CONFIGURED_DISTRICTS = INDIA_STATES.reduce((sum, state) => sum + state.districts.length, 0);

export async function GET() {
  const cached = await cacheGet<object>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const [
      cropCount,
      damCount,
      weatherCount,
      newsCount,
      leaderCount,
      schoolCount,
      activeDistricts,
      latestCrop,
      latestWeather,
    ] = await Promise.all([
      prisma.cropPrice.count(),
      prisma.damReading.count(),
      prisma.weatherReading.count(),
      prisma.newsItem.count(),
      prisma.leader.count(),
      prisma.school.count(),
      prisma.district.count({ where: { active: true } }),
      prisma.cropPrice.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
      prisma.weatherReading.findFirst({ orderBy: { recordedAt: "desc" }, select: { recordedAt: true } }),
    ]);

    const totalDataPoints = cropCount + damCount + weatherCount + newsCount + leaderCount + schoolCount;

    // Most recent update across key tables
    const times = [latestCrop?.fetchedAt, latestWeather?.recordedAt].filter(Boolean) as Date[];
    const mostRecentAt = times.length ? new Date(Math.max(...times.map((t) => t.getTime()))) : null;

    const result = {
      activeDistricts,
      modulesPerDistrict: MODULES_PER_DISTRICT,
      totalDataPoints,
      mostRecentAt: mostRecentAt?.toISOString() ?? null,
      plannedDistricts: Math.max(TOTAL_CONFIGURED_DISTRICTS - activeDistricts, 0),
      fromCache: false,
    };

    await cacheSet(CACHE_KEY, result, 300); // 5 min cache
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[homepage-stats]", err);
    try {
      const fallbackCount = await prisma.district.count({ where: { active: true } });
      return NextResponse.json({
        activeDistricts: fallbackCount,
        modulesPerDistrict: MODULES_PER_DISTRICT,
        totalDataPoints: 0,
        mostRecentAt: null,
        plannedDistricts: Math.max(TOTAL_CONFIGURED_DISTRICTS - fallbackCount, 0),
        fromCache: false,
        error: true,
      });
    } catch {
      return NextResponse.json({
        activeDistricts: 0,
        modulesPerDistrict: MODULES_PER_DISTRICT,
        totalDataPoints: 0,
        mostRecentAt: null,
        plannedDistricts: TOTAL_CONFIGURED_DISTRICTS,
        fromCache: false,
        error: true,
      });
    }
  }
}
