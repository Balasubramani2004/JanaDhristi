/**
 * Vercel Cron: Global trends scrape
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { scrapeGlobalTrends } from "@/scraper/jobs/global-trends";
import { writeLog } from "@/scraper/logger";
import { alertCronFailed } from "@/lib/admin-alerts";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  try {
    const result = await scrapeGlobalTrends();
    await writeLog("global-trends", startedAt, result);
    if (!result.success && result.error) {
      alertCronFailed("scrape-global-trends", result.error).catch(() => {});
    }
    return NextResponse.json({
      ok: result.success,
      recordsNew: result.recordsNew,
      recordsUpdated: result.recordsUpdated,
      error: result.error,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    await writeLog("global-trends", startedAt, {
      success: false,
      recordsNew: 0,
      recordsUpdated: 0,
      error: msg,
    });
    alertCronFailed("scrape-global-trends", msg).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
