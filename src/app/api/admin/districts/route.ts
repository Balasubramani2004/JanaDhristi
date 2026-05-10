/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 *
 * GET /api/admin/districts — returns active districts + states.
 * `states` is additive for the Content Editor / manual-supporter State→District cascade.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";

export async function GET() {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [districts, states] = await Promise.all([
    prisma.district.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        nameLocal: true,
        stateId: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.state.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({ districts, states });
}
