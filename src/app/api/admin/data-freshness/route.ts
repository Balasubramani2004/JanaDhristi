/**
 * JanaDhristi — Admin data freshness diagnostics
 * GET /api/admin/data-freshness
 * Cookie auth: ftp_admin_v1=ok
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";
const NEWS_STALE_HOURS = 2;
const CROPS_STALE_DAYS = 2;

type FreshnessStatus = "fresh" | "stale" | "missing";

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function hoursSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const hours = (Date.now() - date.getTime()) / 3_600_000;
  return Number(hours.toFixed(2));
}

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const days = (Date.now() - date.getTime()) / 86_400_000;
  return Number(days.toFixed(2));
}

function freshnessStatus(value: number | null, threshold: number): FreshnessStatus {
  if (value === null) return "missing";
  return value <= threshold ? "fresh" : "stale";
}

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    districts.map(async (district) => {
      const [latestCrop, latestNews, cropSuccess, cropError, newsSuccess, newsError] = await Promise.all([
        prisma.cropPrice.findFirst({
          where: { districtId: district.id },
          orderBy: { date: "desc" },
          select: { date: true, fetchedAt: true },
        }),
        prisma.newsItem.findFirst({
          where: { districtId: district.id },
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true, fetchedAt: true },
        }),
        prisma.scraperLog.findFirst({
          where: {
            status: "success",
            OR: [
              { jobName: "crops" },
              { jobName: `crops/${district.slug}` },
              { jobName: "scrape-crops" },
            ],
          },
          orderBy: { startedAt: "desc" },
          select: { startedAt: true, completedAt: true, recordsNew: true, recordsUpdated: true },
        }),
        prisma.scraperLog.findFirst({
          where: {
            status: "error",
            OR: [
              { jobName: "crops" },
              { jobName: `crops/${district.slug}` },
              { jobName: "scrape-crops" },
            ],
          },
          orderBy: { startedAt: "desc" },
          select: { startedAt: true, error: true },
        }),
        prisma.scraperLog.findFirst({
          where: {
            status: "success",
            OR: [
              { jobName: "news" },
              { jobName: `news/${district.slug}` },
              { jobName: "scrape-news" },
            ],
          },
          orderBy: { startedAt: "desc" },
          select: { startedAt: true, completedAt: true, recordsNew: true, recordsUpdated: true },
        }),
        prisma.scraperLog.findFirst({
          where: {
            status: "error",
            OR: [
              { jobName: "news" },
              { jobName: `news/${district.slug}` },
              { jobName: "scrape-news" },
            ],
          },
          orderBy: { startedAt: "desc" },
          select: { startedAt: true, error: true },
        }),
      ]);

      const latestNewsAt = latestNews?.publishedAt ?? null;
      const latestCropDate = latestCrop?.date ?? null;
      const newsAgeHours = hoursSince(latestNewsAt);
      const cropsAgeDays = daysSince(latestCropDate);

      return {
        district: {
          id: district.id,
          slug: district.slug,
          name: district.name,
          stateSlug: district.state?.slug ?? null,
          stateName: district.state?.name ?? null,
        },
        data: {
          news: {
            latestPublishedAt: toIso(latestNewsAt),
            latestFetchedAt: toIso(latestNews?.fetchedAt),
            ageHours: newsAgeHours,
            status: freshnessStatus(newsAgeHours, NEWS_STALE_HOURS),
          },
          crops: {
            latestMandiDate: toIso(latestCropDate),
            latestFetchedAt: toIso(latestCrop?.fetchedAt),
            ageDays: cropsAgeDays,
            status: freshnessStatus(cropsAgeDays, CROPS_STALE_DAYS),
          },
        },
        jobs: {
          news: {
            lastSuccess: newsSuccess
              ? {
                  startedAt: toIso(newsSuccess.startedAt),
                  completedAt: toIso(newsSuccess.completedAt),
                  recordsNew: newsSuccess.recordsNew ?? 0,
                  recordsUpdated: newsSuccess.recordsUpdated ?? 0,
                }
              : null,
            lastError: newsError
              ? {
                  startedAt: toIso(newsError.startedAt),
                  error: newsError.error ?? "Unknown error",
                }
              : null,
          },
          crops: {
            lastSuccess: cropSuccess
              ? {
                  startedAt: toIso(cropSuccess.startedAt),
                  completedAt: toIso(cropSuccess.completedAt),
                  recordsNew: cropSuccess.recordsNew ?? 0,
                  recordsUpdated: cropSuccess.recordsUpdated ?? 0,
                }
              : null,
            lastError: cropError
              ? {
                  startedAt: toIso(cropError.startedAt),
                  error: cropError.error ?? "Unknown error",
                }
              : null,
          },
        },
      };
    })
  );

  const staleCounts = rows.reduce(
    (acc, row) => {
      if (row.data.news.status === "stale" || row.data.news.status === "missing") acc.news += 1;
      if (row.data.crops.status === "stale" || row.data.crops.status === "missing") acc.crops += 1;
      return acc;
    },
    { news: 0, crops: 0 }
  );

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    thresholds: { newsStaleHours: NEWS_STALE_HOURS, cropsStaleDays: CROPS_STALE_DAYS },
    staleDistrictCounts: staleCounts,
    districts: rows,
  });
}
