/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Weekly budget data collection
// Schedule: Every Monday at 6 AM UTC (11:30 AM IST)
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeBudget } from "@/scraper/jobs/budget";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeDistricts = await prisma.district.findMany({
      where: { active: true },
      include: { state: true },
    });

    const results: { district: string; new: number; updated: number; error?: string }[] = [];

    for (const district of activeDistricts) {
      const ctx: JobContext = {
        districtId: district.id,
        districtSlug: district.slug,
        districtName: district.name,
        stateSlug: district.state.slug,
        stateName: district.state.name,
        log: (msg: string) => console.log(`[Budget/${district.slug}] ${msg}`),
      };

      const result = await scrapeBudget(ctx);
      results.push({
        district: district.slug,
        new: result.recordsNew,
        updated: result.recordsUpdated,
        error: result.error,
      });

      // Rate limit: 3 second delay between districts
      await new Promise((r) => setTimeout(r, 3000));
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      districts: results,
      total: results.reduce((s, r) => s + r.new + r.updated, 0),
    });
  } catch (err) {
    console.error("[Cron/Budget]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
