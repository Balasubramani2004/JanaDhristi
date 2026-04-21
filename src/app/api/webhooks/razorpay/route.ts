/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { calculateBadgeLevel } from "@/lib/badge-level";
import { alertPaymentReceived } from "@/lib/admin-alerts";

// All contributor cache keys — bust after any payment event
const CONTRIBUTOR_CACHES = [
  "ftp:contributors:v1",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
];

export async function POST(req: NextRequest) {
  // If Razorpay keys aren't configured yet, return 200 gracefully
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.log("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping");
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Verify signature
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event: string;
    payload: {
      payment?: { entity: Record<string, unknown> };
      subscription?: { entity: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const subscriptionEntity = payload.payload?.subscription?.entity;

  try {
    // ── Payment events (one-time) ─────────────────────────────
    if (event === "payment.captured" && paymentEntity) {
      await prisma.supporter.upsert({
        where: { paymentId: String(paymentEntity.id ?? "") },
        update: { status: "success" },
        create: {
          name: String(paymentEntity.contact ?? paymentEntity.email ?? "Anonymous"),
          email: paymentEntity.email ? String(paymentEntity.email) : null,
          phone: paymentEntity.contact ? String(paymentEntity.contact) : null,
          amount: Number(paymentEntity.amount ?? 0) / 100, // paise → rupees
          currency: String(paymentEntity.currency ?? "INR"),
          paymentId: String(paymentEntity.id),
          orderId: paymentEntity.order_id ? String(paymentEntity.order_id) : null,
          method: paymentEntity.method ? String(paymentEntity.method) : null,
          status: "success",
          razorpayData: paymentEntity as object,
        },
      });
    } else if (event === "payment.failed" && paymentEntity) {
      await prisma.supporter.upsert({
        where: { paymentId: String(paymentEntity.id ?? "") },
        update: { status: "failed" },
        create: {
          name: String(paymentEntity.contact ?? paymentEntity.email ?? "Anonymous"),
          email: paymentEntity.email ? String(paymentEntity.email) : null,
          phone: paymentEntity.contact ? String(paymentEntity.contact) : null,
          amount: Number(paymentEntity.amount ?? 0) / 100,
          currency: String(paymentEntity.currency ?? "INR"),
          paymentId: String(paymentEntity.id),
          orderId: paymentEntity.order_id ? String(paymentEntity.order_id) : null,
          method: paymentEntity.method ? String(paymentEntity.method) : null,
          status: "failed",
          razorpayData: paymentEntity as object,
        },
      });

    // ── Subscription events ───────────────────────────────────
    } else if (event === "subscription.charged" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      const supporter = await prisma.supporter.findFirst({
        where: { razorpaySubscriptionId: subId },
      });
      if (supporter) {
        const badgeLevel = calculateBadgeLevel(supporter.activatedAt);
        await prisma.supporter.update({
          where: { id: supporter.id },
          data: {
            subscriptionStatus: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            badgeLevel,
            // Update amount if charge amount changed
            ...(subscriptionEntity.current_end
              ? {}
              : {}),
          },
        });
      }
    } else if (event === "subscription.halted" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "expired" },
      });
    } else if (event === "subscription.cancelled" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "cancelled" },
      });
    } else if (event === "subscription.paused" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "paused" },
      });
    }

    // Alert on successful payment
    if (event === "payment.captured" && paymentEntity) {
      alertPaymentReceived(Number(paymentEntity.amount ?? 0), "One-time").catch(() => {});
    }

    // Bust all contributor caches so walls refresh immediately
    await Promise.all(CONTRIBUTOR_CACHES.map((k) => cacheSet(k, null, 1)));

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error("[razorpay-webhook]", event, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
