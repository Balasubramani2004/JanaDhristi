/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// Cron: Generate / refresh AI module insights
// POST /api/cron/generate-insights
// Schedule: every 2 hours (vercel.json)
// Processes all districts × modules where expiresAt < now
// Rate-limited: 2s delay between Anthropic calls
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { MODULE_INSIGHT_CONFIGS } from "@/lib/insight-config";
import { generateInsight, hasDataChanged } from "@/lib/insight-generator";
import { alertCronFailed } from "@/lib/admin-alerts";
import { selectProjectsNeedingAnalysis, generateInfraAnalysis } from "@/lib/infra-analysis";

const INFRA_ANALYSIS_CAP_PER_RUN = 10;

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: { district: string; module: string; ok: boolean }[] = [];

  try {
    // Get all active districts
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    });

    // Find all expired or missing insights
    const now = new Date();

    for (const district of districts) {
      for (const config of MODULE_INSIGHT_CONFIGS) {
        // Check if insight exists and is still valid
        const existing = await prisma.aIModuleInsight.findUnique({
          where: { districtId_module: { districtId: district.id, module: config.module } },
          select: { expiresAt: true },
        });

        if (existing && existing.expiresAt > now) {
          // Still fresh — skip
          continue;
        }

        // April 13, 2026 — skip regeneration if underlying data hasn't changed
        // since the last insight. Static modules (leaders, budget, schools)
        // rarely change and were burning Gemini Pro calls on every run.
        // Exception (Apr 15 2026): the leaders module gets a hard 7-day TTL
        // even without data change so the page never shows >2-week-old
        // analysis. During an active election period (any ElectionEvent
        // with polling within 30 days for this district's state), the
        // leaders module refreshes daily.
        if (config.module === "leaders") {
          const electionLive = await prisma.electionEvent.findFirst({
            where: {
              isActive: true,
              state: district.state.slug,
              pollingDate: {
                gte: new Date(Date.now() - 1 * 86_400_000),
                lte: new Date(Date.now() + 30 * 86_400_000),
              },
            },
            select: { id: true },
          });
          const refreshAfterMs = electionLive ? 1 * 86_400_000 : 7 * 86_400_000;
          const generatedAt = existing ? new Date(existing.expiresAt.getTime() - 24 * 3600_000) : null;
          const ageMs = generatedAt ? Date.now() - generatedAt.getTime() : Infinity;
          if (ageMs < refreshAfterMs) {
            console.log(`[generate-insights] Skip leaders/${district.slug} — within TTL window (${electionLive ? "election-live 1d" : "default 7d"})`);
            continue;
          }
          // Fall through to regenerate, ignoring hasDataChanged for leaders.
        } else if (!(await hasDataChanged(district.id, config.module))) {
          console.log(
            `[generate-insights] Skip ${config.module}/${district.slug} — no data change`
          );
          continue;
        }

        // Generate new insight
        const ok = await generateInsight(
          config,
          district.id,
          district.slug,
          district.name,
          district.state.slug,
          district.state.name
        );

        results.push({ district: district.slug, module: config.module, ok });

        // 2-second delay between calls to respect Anthropic rate limits
        await sleep(2000);

        // Stop if approaching timeout
        if (Date.now() - startTime > 270_000) {
          console.log("[generate-insights] Approaching timeout, stopping early");
          break;
        }
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    // ── Pre-compute infra project analyses (zero user-triggered AI) ──
    // Pick up to 10 projects that have real (non-SEED) news updates and no
    // cached analysis; regenerate via Gemini 2.5 Pro and cache for 24h.
    let infraAnalysed = 0;
    let infraFailed = 0;
    try {
      const pending = await selectProjectsNeedingAnalysis(INFRA_ANALYSIS_CAP_PER_RUN);
      for (const projectId of pending) {
        if (Date.now() - startTime > 270_000) break;
        const out = await generateInfraAnalysis(projectId);
        if (out) infraAnalysed++; else infraFailed++;
        await sleep(2000);
      }
    } catch (err) {
      console.error("[generate-insights] infra analysis pass failed:", err);
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      succeeded,
      failed,
      infra: { analysed: infraAnalysed, failed: infraFailed, cap: INFRA_ANALYSIS_CAP_PER_RUN },
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    Sentry.captureException(err);
    alertCronFailed("generate-insights", err instanceof Error ? err.message : String(err)).catch(() => {});
    console.error("[generate-insights] Fatal:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Vercel cron calls via GET
export async function GET(req: NextRequest) {
  return POST(req);
}
