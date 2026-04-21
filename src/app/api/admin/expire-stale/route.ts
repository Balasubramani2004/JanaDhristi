/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

// POST: { alertIds: ["id1", "id2"] } OR { expireOlderThanDays: 14 }
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    alertIds?: string[];
    expireOlderThanDays?: number;
  };

  let expired = 0;

  if (body.alertIds && body.alertIds.length > 0) {
    const result = await prisma.localAlert.updateMany({
      where: { id: { in: body.alertIds } },
      data: { active: false },
    });
    expired = result.count;
  } else if (body.expireOlderThanDays) {
    const cutoff = new Date(Date.now() - body.expireOlderThanDays * 86_400_000);
    const result = await prisma.localAlert.updateMany({
      where: { active: true, createdAt: { lt: cutoff } },
      data: { active: false },
    });
    expired = result.count;
  } else {
    return NextResponse.json({ error: "Provide alertIds or expireOlderThanDays" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, expired });
}
