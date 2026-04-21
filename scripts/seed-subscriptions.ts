/**
 * ForThePeople.in — Seed subscriptions
 * Run: npx tsx scripts/seed-subscriptions.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const subs = [
    { name: "Vercel Pro", provider: "Vercel", category: "hosting", costINR: 1680, billingCycle: "monthly", status: "active", dashboardUrl: "https://vercel.com/dashboard" },
    { name: "Neon PostgreSQL", provider: "Neon", category: "database", costINR: 0, billingCycle: "monthly", status: "active", dashboardUrl: "https://console.neon.tech", notes: "Free tier" },
    { name: "Upstash Redis", provider: "Upstash", category: "database", costINR: 0, billingCycle: "monthly", status: "active", dashboardUrl: "https://console.upstash.com", notes: "Free tier" },
    { name: "forthepeople.in Domain", provider: "Registrar", category: "domain", costINR: 700, billingCycle: "yearly", status: "active" },
    { name: "Sentry", provider: "Sentry", category: "monitoring", costINR: 0, billingCycle: "monthly", status: "active", dashboardUrl: "https://sentry.io", notes: "Free tier" },
    { name: "OpenRouter", provider: "OpenRouter", category: "ai", costINR: 0, billingCycle: "usage-based", status: "active", apiKeyEnvVar: "OPENROUTER_API_KEY", dashboardUrl: "https://openrouter.ai", notes: "$10 loaded" },
    { name: "Razorpay", provider: "Razorpay", category: "payment_gateway", costINR: 0, billingCycle: "usage-based", status: "active", dashboardUrl: "https://dashboard.razorpay.com", notes: "2% per transaction" },
    { name: "Resend", provider: "Resend", category: "email", costINR: 0, billingCycle: "monthly", status: "active", apiKeyEnvVar: "RESEND_API_KEY", dashboardUrl: "https://resend.com", notes: "Free tier" },
    { name: "Plausible Analytics", provider: "Plausible", category: "monitoring", costINR: 0, billingCycle: "monthly", status: "active", dashboardUrl: "https://plausible.io", notes: "Free tier / self-hosted" },
  ];

  for (const sub of subs) {
    await prisma.subscription.upsert({
      where: { id: sub.name },
      create: { ...sub, id: sub.name.toLowerCase().replace(/\s+/g, "-") },
      update: sub,
    });
  }

  // Seed auto-classify setting
  await prisma.adminSetting.upsert({
    where: { key: "feedback_auto_classify" },
    create: { key: "feedback_auto_classify", value: "false" },
    update: {},
  });

  console.log("✅ Seeded subscriptions and admin settings");
}

main().catch(console.error).finally(() => prisma.$disconnect());
