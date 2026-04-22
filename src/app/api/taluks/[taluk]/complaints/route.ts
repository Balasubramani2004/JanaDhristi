import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ taluk: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { taluk: talukSlug } = await ctx.params;
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  const stateSlug = req.nextUrl.searchParams.get("state") ?? "";

  if (!districtSlug || !stateSlug || !talukSlug) {
    return NextResponse.json({ error: "district, state and taluk are required" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, state: { slug: stateSlug } },
    select: { id: true },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const taluk = await prisma.taluk.findFirst({
    where: { districtId: district.id, slug: talukSlug },
    select: { id: true, name: true },
  });
  if (!taluk) return NextResponse.json({ error: "Taluk not found" }, { status: 404 });

  const [count, recent] = await Promise.all([
    prisma.talukComplaint.count({ where: { districtId: district.id, talukId: taluk.id } }),
    prisma.talukComplaint.findMany({
      where: { districtId: district.id, talukId: taluk.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, message: true, status: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ talukName: taluk.name, totalComplaints: count, complaints: recent });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { taluk: talukSlug } = await ctx.params;
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  const stateSlug = req.nextUrl.searchParams.get("state") ?? "";

  if (!districtSlug || !stateSlug || !talukSlug) {
    return NextResponse.json({ error: "district, state and taluk are required" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const message = String(body.message ?? "").trim();
  if (message.length < 10) {
    return NextResponse.json({ error: "Complaint must be at least 10 characters" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Complaint must be under 2000 characters" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, state: { slug: stateSlug } },
    select: { id: true },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const taluk = await prisma.taluk.findFirst({
    where: { districtId: district.id, slug: talukSlug },
    select: { id: true },
  });
  if (!taluk) return NextResponse.json({ error: "Taluk not found" }, { status: 404 });

  const created = await prisma.talukComplaint.create({
    data: {
      districtId: district.id,
      talukId: taluk.id,
      message,
      status: "open",
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, complaint: created }, { status: 201 });
}
