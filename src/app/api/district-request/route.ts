/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Request API
// POST /api/district-request — vote for a district
// GET /api/district-request — get top requested districts
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const TOP_CACHE_KEY = "ftp:district-requests:top";

export async function GET() {
  const cached = await cacheGet<object[]>(TOP_CACHE_KEY);
  if (cached) {
    return NextResponse.json({ top: cached, fromCache: true });
  }

  try {
    const top = await prisma.districtRequest.findMany({
      orderBy: { requestCount: "desc" },
      take: 5,
    });
    await cacheSet(TOP_CACHE_KEY, top, 300);
    return NextResponse.json({ top, fromCache: false });
  } catch (err) {
    console.error("[district-request GET]", err);
    return NextResponse.json({ top: [], fromCache: false, error: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stateName = (body.stateName ?? "").trim();
    const districtName = (body.districtName ?? "").trim();

    if (!stateName || !districtName) {
      return NextResponse.json({ error: "stateName and districtName required" }, { status: 400 });
    }

    // Upsert — increment count
    const record = await prisma.districtRequest.upsert({
      where: { stateName_districtName: { stateName, districtName } },
      create: { stateName, districtName, requestCount: 1 },
      update: { requestCount: { increment: 1 } },
    });

    // Bust top cache
    await cacheSet(TOP_CACHE_KEY, null as unknown as object[], 0);

    return NextResponse.json({ success: true, requestCount: record.requestCount });
  } catch (err) {
    console.error("[district-request POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
