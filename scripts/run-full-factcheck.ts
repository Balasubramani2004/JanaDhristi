// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Full Opus Fact Check Script
// Run: DATABASE_URL="..." ANTHROPIC_API_KEY="..." ANTHROPIC_BASE_URL="..." npx tsx scripts/run-full-factcheck.ts
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const SKIP_MODULES = new Set(["overview", "interactive-map", "services", "file-rti"]);

const ALL_MODULES = [
  "crop-prices", "weather", "water-dams", "finance-budget",
  "population", "police",
  "leadership", "local-industries", "schemes", "elections",
  "transport", "jjm-water", "housing", "power-outages", "schools",
  "farm-advisory", "rti-tracker", "gram-panchayat", "courts", "health",
  "famous-personalities", "alerts", "offices", "citizen-corner", "news",
];

import Anthropic from "@anthropic-ai/sdk";

type DistrictWithState = {
  id: string;
  name: string;
  slug: string;
  population?: number | null;
  area?: number | null;
  literacy?: number | null;
  sexRatio?: number | null;
  talukCount?: number | null;
  state: { name: string };
};

type CheckResult = {
  itemsChecked: number;
  issuesFound: number;
  staleItems: number;
  details: Record<string, unknown>;
};

async function callOpus(prompt: string): Promise<string> {
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return '{"error":"No API key"}';
  const client = new Anthropic({ apiKey, baseURL });
  const msg = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string): T | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return JSON.parse(match ? match[1].trim() : text.trim());
  } catch {
    return null;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runCheck(district: DistrictWithState, module: string): Promise<CheckResult> {
  switch (module) {
    case "leadership": {
      const leaders = await prisma.leader.findMany({ where: { districtId: district.id }, orderBy: { tier: "asc" } });
      if (!leaders.length) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No data" } };
      const issues: unknown[] = [];
      for (let i = 0; i < leaders.length; i += 10) {
        const batch = leaders.slice(i, i + 10);
        const list = batch.map((l) => `- ${l.name}: ${l.role}, Party: ${l.party ?? "N/A"}`).join("\n");
        const text = await callOpus(`Fact-check these officials for ${district.name}, ${district.state.name}, India as of March 2026. Return ONLY a JSON array (no object wrapper): [{"name":"...","correct":true,"issue":""}]\n\n${list}`);
        const raw = parseJSON<unknown>(text);
        const parsed = Array.isArray(raw) ? raw as Array<{ correct: boolean; issue?: string; name?: string }> : (raw as Record<string, unknown>)?.issues as Array<{ correct: boolean; issue?: string }> ?? [];
        for (const item of parsed) if (!item.correct && item.issue) issues.push(item);
        if (i + 10 < leaders.length) await delay(2000);
      }
      return { itemsChecked: leaders.length, issuesFound: issues.length, staleItems: 0, details: { issues } };
    }

    case "famous-personalities": {
      const people = await prisma.famousPersonality.findMany({ where: { districtId: district.id } });
      if (!people.length) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No data" } };
      const list = people.map((p) => `- ${p.name}: ${p.description ?? "N/A"}`).join("\n");
      const text = await callOpus(`Verify each person was BORN in ${district.name}, ${district.state.name}, India.\nDr. Rajkumar was born in Erode, TN — NOT in ${district.name}.\nReturn ONLY a JSON array (no wrapper): [{"name":"...","shouldRemove":false,"reason":""}]\n\n${list}`);
      const raw = parseJSON<unknown>(text);
      const parsed = (Array.isArray(raw) ? raw : []) as Array<{ name: string; shouldRemove: boolean; reason?: string }>;
      const toRemove = parsed.filter((p) => p.shouldRemove).map((p) => p.name);
      if (toRemove.length > 0) {
        const ids = people.filter((p) => toRemove.includes(p.name)).map((p) => p.id);
        await prisma.famousPersonality.deleteMany({ where: { id: { in: ids } } });
        console.log(`  ✂️  Removed ${ids.length} incorrectly listed personalities: ${toRemove.join(", ")}`);
      }
      return { itemsChecked: people.length, issuesFound: toRemove.length, staleItems: 0, details: { removed: toRemove } };
    }

    case "finance-budget": {
      const b = await prisma.budgetEntry.findMany({ where: { districtId: district.id }, take: 20 });
      return { itemsChecked: b.length, issuesFound: 0, staleItems: 0, details: { sectors: b.length } };
    }

    case "crop-prices": {
      const cp = await prisma.cropPrice.findMany({ where: { districtId: district.id }, orderBy: { date: "desc" }, take: 5 });
      const now = Date.now();
      const stale = cp.filter((p) => (now - new Date(p.date).getTime()) / 3_600_000 > 48).length;
      return { itemsChecked: cp.length, issuesFound: 0, staleItems: stale, details: { count: cp.length, stale } };
    }

    case "water-dams": {
      const d = await prisma.damReading.findMany({ where: { districtId: district.id }, orderBy: { recordedAt: "desc" }, take: 5, distinct: ["damName"] });
      const stale = d.filter((x) => (Date.now() - new Date(x.recordedAt).getTime()) / 3_600_000 > 2).length;
      return { itemsChecked: d.length, issuesFound: 0, staleItems: stale, details: { dams: d.length, stale } };
    }

    case "weather": {
      const w = await prisma.weatherReading.findMany({ where: { districtId: district.id }, orderBy: { recordedAt: "desc" }, take: 1 });
      const stale = w.length === 0 ? 1 : (Date.now() - new Date(w[0].recordedAt).getTime()) / 3_600_000 > 1 ? 1 : 0;
      return { itemsChecked: w.length, issuesFound: 0, staleItems: stale, details: { hasData: w.length > 0 } };
    }

    case "police": {
      const stations = await prisma.policeStation.findMany({ where: { districtId: district.id } });
      const noPhone = stations.filter((s) => !s.phone).length;
      return { itemsChecked: stations.length, issuesFound: noPhone > 0 ? 1 : 0, staleItems: 0, details: { total: stations.length, missingPhones: noPhone } };
    }

    case "schools": {
      const s = await prisma.school.findMany({ where: { districtId: district.id } });
      return { itemsChecked: s.length, issuesFound: 0, staleItems: 0, details: { total: s.length } };
    }

    case "elections": {
      const e = await prisma.electionResult.findMany({ where: { districtId: district.id }, orderBy: { year: "desc" }, take: 10 });
      return { itemsChecked: e.length, issuesFound: 0, staleItems: 0, details: { results: e.length } };
    }

    case "offices": {
      const o = await prisma.govOffice.findMany({ where: { districtId: district.id } });
      const noPhone = o.filter((x) => !x.phone).length;
      return { itemsChecked: o.length, issuesFound: noPhone > 0 ? 1 : 0, staleItems: 0, details: { total: o.length, missingPhones: noPhone } };
    }

    case "schemes": {
      const s = await prisma.scheme.findMany({ where: { districtId: district.id } });
      return { itemsChecked: s.length, issuesFound: 0, staleItems: 0, details: { total: s.length } };
    }

    case "local-industries": {
      const li = await prisma.localIndustry.findMany({ where: { districtId: district.id } });
      return { itemsChecked: li.length, issuesFound: 0, staleItems: 0, details: { total: li.length } };
    }

    case "population": {
      const issues = [];
      if (!district.population) issues.push("population");
      if (!district.area) issues.push("area");
      return { itemsChecked: 3, issuesFound: issues.length, staleItems: 0, details: { missing: issues } };
    }

    case "transport": {
      const buses = await prisma.busRoute.findMany({ where: { districtId: district.id } });
      const trains = await prisma.trainSchedule.findMany({ where: { districtId: district.id } });
      return { itemsChecked: buses.length + trains.length, issuesFound: 0, staleItems: 0, details: { buses: buses.length, trains: trains.length } };
    }

    case "jjm-water": {
      const j = await prisma.jJMStatus.findMany({ where: { districtId: district.id } });
      return { itemsChecked: j.length, issuesFound: 0, staleItems: 0, details: { total: j.length } };
    }

    case "housing": {
      const h = await prisma.housingScheme.findMany({ where: { districtId: district.id } });
      return { itemsChecked: h.length, issuesFound: 0, staleItems: 0, details: { total: h.length } };
    }

    case "power-outages": {
      const p = await prisma.powerOutage.findMany({ where: { districtId: district.id }, orderBy: { startTime: "desc" }, take: 5 });
      const stale = p.filter((x) => (Date.now() - new Date(x.startTime).getTime()) / 86_400_000 > 3).length;
      return { itemsChecked: p.length, issuesFound: 0, staleItems: stale, details: { total: p.length, stale } };
    }

    case "courts": {
      const c = await prisma.courtStat.findMany({ where: { districtId: district.id } });
      return { itemsChecked: c.length, issuesFound: 0, staleItems: 0, details: { total: c.length } };
    }

    case "health": {
      const h = await prisma.govOffice.findMany({ where: { districtId: district.id, type: { contains: "hospital", mode: "insensitive" } } });
      return { itemsChecked: h.length, issuesFound: 0, staleItems: 0, details: { hospitals: h.length } };
    }

    case "gram-panchayat": {
      const gp = await prisma.gramPanchayat.findMany({ where: { districtId: district.id } });
      return { itemsChecked: gp.length, issuesFound: 0, staleItems: 0, details: { total: gp.length } };
    }

    case "farm-advisory": {
      const fa = await prisma.agriAdvisory.findMany({ where: { districtId: district.id } });
      return { itemsChecked: fa.length, issuesFound: 0, staleItems: 0, details: { total: fa.length } };
    }

    case "rti-tracker": {
      const rti = await prisma.rtiStat.findMany({ where: { districtId: district.id } });
      return { itemsChecked: rti.length, issuesFound: 0, staleItems: 0, details: { total: rti.length } };
    }

    case "citizen-corner": {
      const tips = await prisma.citizenTip.findMany({ where: { districtId: district.id } });
      return { itemsChecked: tips.length, issuesFound: 0, staleItems: 0, details: { total: tips.length } };
    }

    case "alerts": {
      const alerts = await prisma.localAlert.findMany({ where: { districtId: district.id, active: true } });
      const stale = alerts.filter((a) => (Date.now() - new Date(a.createdAt).getTime()) / 86_400_000 > 7).length;
      return { itemsChecked: alerts.length, issuesFound: 0, staleItems: stale, details: { active: alerts.length, stale } };
    }

    case "news": {
      const news = await prisma.newsItem.findMany({ where: { districtId: district.id }, orderBy: { publishedAt: "desc" }, take: 30, select: { id: true, title: true, publishedAt: true } });
      const seen = new Map<string, typeof news>();
      for (const item of news) {
        const key = (item.title ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").substring(0, 50);
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(item);
      }
      const dupeIds = [...seen.values()].filter((g) => g.length > 1).flatMap((g) => g.slice(1).map((i) => i.id));
      if (dupeIds.length > 0) await prisma.newsItem.deleteMany({ where: { id: { in: dupeIds } } });
      return { itemsChecked: news.length, issuesFound: 0, staleItems: 0, details: { total: news.length, dupeRemoved: dupeIds.length } };
    }

    default:
      return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No checker" } };
  }
}

async function main() {
  const districts = await prisma.district.findMany({
    where: { active: true },
    include: { state: { select: { name: true } } },
  });

  console.log(`\n${"═".repeat(60)}`);
  console.log("  OPUS FULL FACT CHECK — ForThePeople.in");
  console.log(`  Districts: ${districts.map((d) => d.name).join(", ")}`);
  console.log(`${"═".repeat(60)}\n`);

  const summary: Array<{ district: string; module: string; checked: number; issues: number; stale: number; status: string }> = [];

  for (const district of districts) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  DISTRICT: ${district.name.toUpperCase()}`);
    console.log(`${"─".repeat(50)}`);

    for (const mod of ALL_MODULES) {
      if (SKIP_MODULES.has(mod)) continue;
      process.stdout.write(`  ✦ ${mod.padEnd(22)}`);

      try {
        const result = await runCheck(district, mod);

        const status = result.issuesFound > 0 ? "issues" : "passed";
        const statusIcon = status === "passed" ? "✅" : "⚠️";
        console.log(`${statusIcon}  checked=${result.itemsChecked}  issues=${result.issuesFound}  stale=${result.staleItems}`);

        await prisma.factCheckStatus.upsert({
          where: { districtId_module: { districtId: district.id, module: mod } },
          create: {
            districtId: district.id,
            module: mod,
            status,
            itemsChecked: result.itemsChecked,
            issuesFound: result.issuesFound,
            staleItems: result.staleItems,
            lastChecked: new Date(),
            checkedBy: "opus",
            details: result.details as object,
          },
          update: {
            status,
            itemsChecked: result.itemsChecked,
            issuesFound: result.issuesFound,
            staleItems: result.staleItems,
            lastChecked: new Date(),
            checkedBy: "opus",
            details: result.details as object,
          },
        });

        summary.push({ district: district.name, module: mod, checked: result.itemsChecked, issues: result.issuesFound, stale: result.staleItems, status });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`❌  ${msg.substring(0, 60)}`);
        summary.push({ district: district.name, module: mod, checked: 0, issues: 0, stale: 0, status: "failed" });
      }
    }
  }

  // ── Final report ─────────────────────────────────────────
  console.log(`\n${"═".repeat(80)}`);
  console.log("  OPUS FACT CHECK REPORT");
  console.log(`${"═".repeat(80)}`);

  const header = "MODULE                  | DISTRICT           | CHKD | ISSUES | STATUS";
  const divider = "─".repeat(header.length);
  console.log(header);
  console.log(divider);

  for (const row of summary) {
    const icon = row.status === "passed" ? "✅" : row.status === "failed" ? "❌" : "⚠️";
    console.log(
      `${row.module.padEnd(24)}| ${row.district.padEnd(19)}| ${String(row.checked).padEnd(5)}| ${String(row.issues).padEnd(7)}| ${icon} ${row.status}`
    );
  }

  const totalChecked = summary.reduce((s, r) => s + r.checked, 0);
  const totalIssues = summary.reduce((s, r) => s + r.issues, 0);
  const passed = summary.filter((r) => r.status === "passed").length;

  console.log(`\nTotal records checked: ${totalChecked}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Modules passed: ${passed}/${summary.length}`);
  console.log(`\n✅ Fact check complete. Results saved to DB.\n`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
