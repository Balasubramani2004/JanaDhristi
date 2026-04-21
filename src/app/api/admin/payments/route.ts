/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// GET /api/admin/payments — returns paid contributions with summary stats
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

function safeCheckAuth(provided: string | null, secret: string): boolean {
  if (!provided || provided.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}

export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  const auth = req.headers.get("x-admin-secret");
  if (!safeCheckAuth(auth, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributions = await prisma.contribution.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const paid = contributions.filter((c) => c.status === "paid");
  const totalPaise = paid.reduce((sum, c) => sum + c.amount, 0);

  return NextResponse.json({
    contributions,
    summary: {
      totalCount: paid.length,
      totalAmount: totalPaise, // in paise
      totalAmountRs: Math.round(totalPaise / 100),
    },
  });
}
