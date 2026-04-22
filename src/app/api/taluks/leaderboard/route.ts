import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  const stateSlug = req.nextUrl.searchParams.get("state") ?? "";

  if (!districtSlug || !stateSlug) {
    return NextResponse.json({ error: "district and state are required" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, state: { slug: stateSlug } },
    select: {
      id: true,
      taluks: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const counts = await prisma.talukComplaint.groupBy({
    by: ["talukId"],
    where: { districtId: district.id },
    _count: { _all: true },
  });

  const countMap = new Map<string, number>(counts.map((item) => [item.talukId, item._count._all]));
  const rows = district.taluks
    .map((taluk) => ({ talukId: taluk.id, talukName: taluk.name, talukSlug: taluk.slug, complaints: countMap.get(taluk.id) ?? 0 }))
    .sort((a, b) => b.complaints - a.complaints || a.talukName.localeCompare(b.talukName));

  return NextResponse.json({ leaderboard: rows });
}
