/**
 * ForThePeople.in — Sidebar nav badge counts
 * GET /api/admin/nav-counts
 * Returns: { unreadAlerts, pendingReviews, unreadFeedback }
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

  const [unreadAlerts, pendingReviews, unreadFeedback] = await Promise.all([
    prisma.adminAlert.count({ where: { read: false } }).catch(() => 0),
    prisma.reviewQueue.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.feedback.count({ where: { status: "new" } }).catch(() => 0),
  ]);

  return NextResponse.json({ unreadAlerts, pendingReviews, unreadFeedback });
}
