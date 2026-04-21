/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Cron: AI News Intelligence
// Triggered by Vercel Cron (every 4 hours)
// Protected by CRON_SECRET
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { runAIAnalyzer } from "@/scraper/jobs/ai-analyzer";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runAIAnalyzer();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[cron/news-intelligence] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
