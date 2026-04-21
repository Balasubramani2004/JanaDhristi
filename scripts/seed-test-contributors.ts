/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Seeds 20 test contributors with [TEST] prefix.
 * Run:  npx tsx -r dotenv/config scripts/seed-test-contributors.ts
 * Clean: npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Real DB IDs from the database ─────────────────────────
const IDS = {
  states: {
    karnataka: "cmmv9n6aq0000ubxn6wmqxg8k",
    telangana: "cmnrsy1p3000yx8xn5tc1e85g",
    maharashtra: "cmnfhenrz000gl6xn3cv64o5x",
    tamilNadu: "cmnfheqxw0015l6xnki0y4rsd",
  },
  districts: {
    mandya: "cmmv9n6cq0001ubxntuw11cty",
    hyderabad: "cmnrsy1qv000zx8xnphxfw5mf",
    mumbai: "cmnfhentm000hl6xntaak7dxo",
    chennai: "cmnfheqze0016l6xncib8jxq4",
  },
};

function monthsAgo(n: number): Date {
  return new Date(Date.now() - n * 30 * 24 * 60 * 60 * 1000);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function randomPayId(): string {
  return "pay_test_" + Math.random().toString(36).slice(2, 14);
}

function randomSubId(): string {
  return "sub_test_" + Math.random().toString(36).slice(2, 14);
}

function detectPlatform(url: string | null): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("github.com")) return "github";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
  return "website";
}

function calcBadge(activatedAt: Date): string | null {
  const months = Math.floor((Date.now() - activatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months >= 24) return "platinum";
  if (months >= 12) return "gold";
  if (months >= 6) return "silver";
  if (months >= 3) return "bronze";
  return null;
}

interface SeedRecord {
  name: string;
  email: string;
  amount: number;
  tier: string;
  isRecurring: boolean;
  subscriptionStatus: string | null;
  activatedAt: Date | null;
  expiresAt: Date | null;
  stateId: string | null;
  districtId: string | null;
  socialLink: string | null;
  isPublic: boolean;
  badgeType: string | null;
  message: string | null;
}

const RECORDS: SeedRecord[] = [
  // ── All-India Patrons (2) ──────────────────────────────
  {
    name: "[TEST] Vikram Patel",
    email: "vikram@test.forthepeople.in",
    amount: 50000,
    tier: "patron",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(14),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: "https://linkedin.com/in/test-vikram",
    isPublic: true,
    badgeType: "patron",
    message: "For a transparent India!",
  },
  {
    name: "[TEST] Priya Mehta",
    email: "priya@test.forthepeople.in",
    amount: 50000,
    tier: "patron",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(3),
    expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: "https://instagram.com/test-priya",
    isPublic: true,
    badgeType: "patron",
    message: null,
  },

  // ── State Champions (2) ────────────────────────────────
  {
    name: "[TEST] Anita Sharma",
    email: "anita@test.forthepeople.in",
    amount: 10000,
    tier: "state",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(8),
    expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.karnataka,
    districtId: null,
    socialLink: "https://twitter.com/test-anita",
    isPublic: true,
    badgeType: "state",
    message: "Karnataka deserves transparency",
  },
  {
    name: "[TEST] Ravi Teja",
    email: "ravi@test.forthepeople.in",
    amount: 10000,
    tier: "state",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(2),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.telangana,
    districtId: null,
    socialLink: "https://linkedin.com/in/test-ravi",
    isPublic: true,
    badgeType: "state",
    message: null,
  },

  // ── District Champions (4) ─────────────────────────────
  {
    name: "[TEST] Rahul Kumar",
    email: "rahul@test.forthepeople.in",
    amount: 2000,
    tier: "district",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(6),
    expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.karnataka,
    districtId: IDS.districts.mandya,
    socialLink: "https://github.com/test-rahul",
    isPublic: true,
    badgeType: "champion",
    message: "Mandya is my hometown!",
  },
  {
    name: "[TEST] Deepa Nair",
    email: "deepa@test.forthepeople.in",
    amount: 2000,
    tier: "district",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(4),
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.telangana,
    districtId: IDS.districts.hyderabad,
    socialLink: "https://instagram.com/test-deepa",
    isPublic: true,
    badgeType: "champion",
    message: null,
  },
  {
    name: "[TEST] Arjun Reddy",
    email: "arjun@test.forthepeople.in",
    amount: 2000,
    tier: "district",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(1),
    expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.maharashtra,
    districtId: IDS.districts.mumbai,
    socialLink: null,
    isPublic: true,
    badgeType: "champion",
    message: null,
  },
  {
    name: "[TEST] Karthik S",
    email: "karthik@test.forthepeople.in",
    amount: 2000,
    tier: "district",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(25),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    stateId: IDS.states.tamilNadu,
    districtId: IDS.districts.chennai,
    socialLink: "https://linkedin.com/in/test-karthik",
    isPublic: true,
    badgeType: "champion",
    message: "Open data for Chennai!",
  },

  // ── Monthly Supporters (5) ─────────────────────────────
  {
    name: "[TEST] Sanjay Gupta",
    email: "sanjay@test.forthepeople.in",
    amount: 200,
    tier: "monthly",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(7),
    expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: "https://twitter.com/test-sanjay",
    isPublic: true,
    badgeType: "supporter",
    message: null,
  },
  {
    name: "[TEST] Meera Krishnan",
    email: "meera@test.forthepeople.in",
    amount: 500,
    tier: "monthly",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(4),
    expiresAt: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: null,
    isPublic: true,
    badgeType: "supporter",
    message: "Keep up the great work!",
  },
  {
    name: "[TEST] Anonymous Supporter",
    email: "anonymous@test.forthepeople.in",
    amount: 200,
    tier: "monthly",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(2),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: null,
    isPublic: false,
    badgeType: "supporter",
    message: "Silent supporter",
  },
  {
    name: "[TEST] Amit Joshi",
    email: "amit@test.forthepeople.in",
    amount: 1000,
    tier: "monthly",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(12),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: "https://github.com/test-amit",
    isPublic: true,
    badgeType: "supporter",
    message: null,
  },
  {
    name: "[TEST] Farah Khan",
    email: "farah@test.forthepeople.in",
    amount: 200,
    tier: "monthly",
    isRecurring: true,
    subscriptionStatus: "active",
    activatedAt: monthsAgo(1),
    expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    stateId: null,
    districtId: null,
    socialLink: null,
    isPublic: true,
    badgeType: "supporter",
    message: null,
  },

  // ── One-Time Contributors (5) ──────────────────────────
  {
    name: "[TEST] Rajesh Iyer",
    email: "rajesh@test.forthepeople.in",
    amount: 5000,
    tier: "chai",
    isRecurring: false,
    subscriptionStatus: null,
    activatedAt: null,
    expiresAt: null,
    stateId: IDS.states.karnataka,
    districtId: IDS.districts.mandya,
    socialLink: null,
    isPublic: true,
    badgeType: null,
    message: "For Mandya!",
  },
  {
    name: "[TEST] Lakshmi Devi",
    email: "lakshmi@test.forthepeople.in",
    amount: 2500,
    tier: "custom",
    isRecurring: false,
    subscriptionStatus: null,
    activatedAt: null,
    expiresAt: null,
    stateId: IDS.states.telangana,
    districtId: IDS.districts.hyderabad,
    socialLink: null,
    isPublic: true,
    badgeType: null,
    message: null,
  },
  {
    name: "[TEST] Suresh Babu",
    email: "suresh@test.forthepeople.in",
    amount: 1000,
    tier: "chai",
    isRecurring: false,
    subscriptionStatus: null,
    activatedAt: null,
    expiresAt: null,
    stateId: null,
    districtId: null,
    socialLink: "https://instagram.com/test-suresh",
    isPublic: true,
    badgeType: null,
    message: null,
  },
  {
    name: "[TEST] Neha Agarwal",
    email: "neha@test.forthepeople.in",
    amount: 500,
    tier: "custom",
    isRecurring: false,
    subscriptionStatus: null,
    activatedAt: null,
    expiresAt: null,
    stateId: IDS.states.maharashtra,
    districtId: IDS.districts.mumbai,
    socialLink: null,
    isPublic: true,
    badgeType: null,
    message: "Small help for big change",
  },
  {
    name: "[TEST] Prakash M",
    email: "prakash@test.forthepeople.in",
    amount: 50,
    tier: "chai",
    isRecurring: false,
    subscriptionStatus: null,
    activatedAt: null,
    expiresAt: null,
    stateId: null,
    districtId: null,
    socialLink: null,
    isPublic: true,
    badgeType: null,
    message: null,
  },

  // ── Expired / Cancelled (2) ────────────────────────────
  {
    name: "[TEST] Expired User",
    email: "expired@test.forthepeople.in",
    amount: 2000,
    tier: "district",
    isRecurring: true,
    subscriptionStatus: "expired",
    activatedAt: monthsAgo(5),
    expiresAt: daysAgo(15),
    stateId: IDS.states.karnataka,
    districtId: IDS.districts.mandya,
    socialLink: null,
    isPublic: true,
    badgeType: "champion",
    message: null,
  },
  {
    name: "[TEST] Cancelled User",
    email: "cancelled@test.forthepeople.in",
    amount: 10000,
    tier: "state",
    isRecurring: true,
    subscriptionStatus: "cancelled",
    activatedAt: monthsAgo(4),
    expiresAt: daysAgo(5),
    stateId: IDS.states.karnataka,
    districtId: null,
    socialLink: null,
    isPublic: true,
    badgeType: "state",
    message: null,
  },
];

async function main() {
  console.log("Seeding 20 test contributors...\n");

  // Delete any existing test records first (idempotent)
  const existing = await prisma.supporter.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "[TEST]" } },
        { email: { endsWith: "@test.forthepeople.in" } },
      ],
    },
  });
  if (existing.count > 0) {
    console.log(`  Cleaned ${existing.count} existing test records first.\n`);
  }

  const created: Array<{ name: string; tier: string; amount: string; status: string; badge: string; location: string; months: string }> = [];

  for (const r of RECORDS) {
    const badgeLevel = r.activatedAt ? calcBadge(r.activatedAt) : null;
    const socialPlatform = detectPlatform(r.socialLink);
    const monthsActive = r.activatedAt
      ? Math.floor((Date.now() - r.activatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 0;

    await prisma.supporter.create({
      data: {
        name: r.name,
        email: r.email,
        amount: r.amount,
        tier: r.tier,
        isRecurring: r.isRecurring,
        subscriptionStatus: r.subscriptionStatus,
        activatedAt: r.activatedAt,
        expiresAt: r.expiresAt,
        stateId: r.stateId,
        districtId: r.districtId,
        socialLink: r.socialLink,
        socialPlatform,
        isPublic: r.isPublic,
        badgeType: r.badgeType,
        badgeLevel,
        message: r.message,
        status: "success",
        paymentId: randomPayId(),
        razorpaySubscriptionId: r.isRecurring ? randomSubId() : null,
      },
    });

    const location = r.districtId
      ? Object.entries(IDS.districts).find(([, v]) => v === r.districtId)?.[0] ?? "—"
      : r.stateId
        ? Object.entries(IDS.states).find(([, v]) => v === r.stateId)?.[0] ?? "—"
        : "—";

    created.push({
      name: r.name.replace("[TEST] ", ""),
      tier: r.tier,
      amount: r.isRecurring ? `₹${r.amount.toLocaleString("en-IN")}/mo` : `₹${r.amount.toLocaleString("en-IN")}`,
      status: r.subscriptionStatus ?? "one-time",
      badge: badgeLevel ?? "—",
      location,
      months: monthsActive > 0 ? `${monthsActive}mo` : "—",
    });
  }

  // Print summary table
  console.log("═══════════════════════════════════════════════════════════════════════════════════");
  console.log("  Name                  │ Tier     │ Amount       │ Status    │ Badge    │ Location    │ Active");
  console.log("─────────────────────────┼──────────┼──────────────┼───────────┼──────────┼─────────────┼────────");
  for (const c of created) {
    console.log(
      `  ${c.name.padEnd(22)} │ ${c.tier.padEnd(8)} │ ${c.amount.padEnd(12)} │ ${c.status.padEnd(9)} │ ${c.badge.padEnd(8)} │ ${c.location.padEnd(11)} │ ${c.months}`
    );
  }
  console.log("═══════════════════════════════════════════════════════════════════════════════════");
  console.log(`\n✅ Seeded ${created.length} test contributors.\n`);
  console.log("Test pages:");
  console.log("  /en/support                        — 6 tier cards");
  console.log("  /en/karnataka/mandya               — Sponsor banner (Rahul + Anita state + 2 patrons)");
  console.log("  /en/karnataka/mandya/contributors  — Full leaderboard + grids");
  console.log("  /en/telangana/hyderabad            — Deepa + Ravi state + 2 patrons");
  console.log("  /en/contributors                   — Global leaderboard (all 20)");
  console.log("  /en/admin/supporters               — Admin table with filters\n");
  console.log("Verify:");
  console.log("  ✓ Expired/Cancelled users do NOT show on district pages");
  console.log("  ✓ Anonymous Supporter shows as 'Anonymous' with no social link");
  console.log("  ✓ One-time contributors sorted by amount (₹5,000 first, ₹50 last)");
  console.log(`\nCleanup: npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
