/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";

const COOKIE = "ftp_admin_v1";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

// POST: { code: "123456" } — must provide valid TOTP code to disable
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  if (!adminAuth?.totpEnabled || !adminAuth?.totpSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  const valid = verifyTOTP(adminAuth.totpSecret, code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: { totpEnabled: false, totpSecret: null, backupCodes: null, totpVerifiedAt: null },
  });

  return NextResponse.json({ disabled: true });
}
