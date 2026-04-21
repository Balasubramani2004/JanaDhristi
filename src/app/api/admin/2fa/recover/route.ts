/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

// Lazy-init Resend to avoid build-time throw when key is not set
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
}

// Rate limit: max 3 recovery emails per hour per IP
const recoveryAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRecoveryRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = recoveryAttempts.get(ip);
  if (!record || now > record.resetAt) {
    recoveryAttempts.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

// POST: { email: "..." } — send recovery email
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRecoveryRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many recovery attempts. Try again in 1 hour." },
      { status: 429 }
    );
  }

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  if (!adminAuth) {
    // Don't reveal if email matches or not
    return NextResponse.json({ sent: true, message: "If the email matches, a recovery link has been sent." });
  }

  if (adminAuth.recoveryEmail.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ sent: true, message: "If the email matches, a recovery link has been sent." });
  }

  // Generate a one-time token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 3_600_000); // 1 hour

  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: { recoveryToken: tokenHash, recoveryTokenExpiry: expiry },
  });

  // Send email
  try {
    const resend = getResend();
    await resend.emails.send({
      from: "ForThePeople.in <noreply@forthepeople.in>",
      to: adminAuth.recoveryEmail,
      subject: "🔐 Admin 2FA Recovery — ForThePeople.in",
      html: `
        <h2>Admin 2FA Recovery</h2>
        <p>Someone requested to reset 2FA for the ForThePeople.in admin panel.</p>
        <p>If this was you, click the link below to disable 2FA and log in with your password only:</p>
        <p><a href="https://forthepeople.in/en/admin/recover?token=${token}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset 2FA</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email and consider changing your admin password immediately.</p>
        <p style="color:#666;font-size:13px;">Recovery phone on file: +91 •••••72249</p>
        <hr>
        <p style="color:#666;font-size:12px;">ForThePeople.in — Citizen Transparency Platform</p>
      `,
    });
  } catch (e) {
    console.error("[2fa/recover] Email send failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to send email. Check RESEND_API_KEY." }, { status: 500 });
  }

  return NextResponse.json({ sent: true, message: "Recovery email sent" });
}
