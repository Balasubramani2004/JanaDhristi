/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Crop prices — 03:30 UTC (~9 AM IST) and 09:30 UTC (~3 PM IST)
// AGMARKNET / data.gov.in API
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { scrapeCrops } from "@/scraper/jobs/crops";
import { alertCronFailed } from "@/lib/admin-alerts";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeDistricts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const results: Array<{
    district: string;
    success: boolean;
    newCount: number;
    updatedCount: number;
    error?: string;
  }> = [];

  for (const row of activeDistricts) {
    const state = (row as { state?: { slug: string; name: string } }).state;
    if (!state) {
      results.push({ district: row.slug, success: false, newCount: 0, updatedCount: 0, error: "Missing state relation" });
      continue;
    }
    const stateSlug = state.slug;
    const stateName = state.name;
    const logs: string[] = [];
    const ctx: JobContext = {
      districtSlug: row.slug,
      districtId: row.id,
      districtName: row.name,
      stateSlug,
      stateName,
      log: (msg) => logs.push(msg),
    };

    try {
      const result = await scrapeCrops(ctx);
      results.push({
        district: row.slug,
        success: result.success,
        newCount: result.recordsNew,
        updatedCount: result.recordsUpdated,
      });
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : String(err);
      alertCronFailed("scrape-crops", msg).catch(() => {});
      results.push({ district: row.slug, success: false, newCount: 0, updatedCount: 0, error: msg });
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updatedCount, 0);
  return NextResponse.json({
    ok: true,
    districts: results.length,
    totalNewRecords: totalNew,
    totalUpdatedRecords: totalUpdated,
    results,
  });
}
