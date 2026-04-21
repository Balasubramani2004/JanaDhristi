/**
 * ForThePeople.in — Infra project analysis (cache-read-only)
 *
 * GET /api/data/infra-analysis?projectId=<cuid>
 *
 * Returns a pre-computed Gemini 2.5 Pro analysis if the cron has already
 * generated one. Never triggers AI on its own — that was moved to
 * /api/cron/generate-insights so public page loads stay zero-cost.
 *
 * Response shape:
 *   Cache hit →  200 { citizenImpact, accountability, notes, sources,
 *                      generatedAt, cached: true, unavailable: false }
 *   Cache miss → 200 { unavailable: true, cached: false }
 *   Invalid    → 400
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { readCachedInfraAnalysis } from "@/lib/infra-analysis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
  if (!projectId) {
    return NextResponse.json({ error: "projectId param required" }, { status: 400 });
  }

  try {
    const analysis = await readCachedInfraAnalysis(projectId);
    if (!analysis) {
      const resp = NextResponse.json({ unavailable: true, cached: false });
      resp.headers.set("Cache-Control", "public, s-maxage=600");
      return resp;
    }
    const resp = NextResponse.json({ ...analysis, cached: true, unavailable: false });
    resp.headers.set("Cache-Control", "public, s-maxage=3600");
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[api/data/infra-analysis] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
