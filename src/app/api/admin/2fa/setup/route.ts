/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { generateTOTPSecret, generateQRCode, generateBackupCodes } from "@/lib/totp";

const COOKIE = "ftp_admin_v1";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

// POST: Generate new TOTP secret + QR code (does NOT enable 2FA yet)
// Stores the pending secret in DB under a temp field until verify confirms it
export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, encryptedSecret } = generateTOTPSecret();
  const qrCodeDataUrl = await generateQRCode(secret);
  const { codes, encryptedCodes } = generateBackupCodes();

  // Store pending secret in DB (totpEnabled stays false until verify)
  await prisma.adminAuth.upsert({
    where: { id: "admin" },
    update: { totpSecret: encryptedSecret, backupCodes: encryptedCodes },
    create: {
      id: "admin",
      totpSecret: encryptedSecret,
      backupCodes: encryptedCodes,
      totpEnabled: false,
    },
  });

  return NextResponse.json({
    qrCodeDataUrl,
    secret, // plain text for manual entry
    backupCodes: codes,
  });
}
