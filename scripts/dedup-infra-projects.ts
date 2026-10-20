/**
 * JanaDhristi — Manual merge for duplicate InfraProject rows
 * Run: npx tsx scripts/dedup-infra-projects.ts [--dry-run] [--district <slug>]
 *
 * Within each district, finds projects whose names overlap heavily
 * (>=60% significant-token match OR Levenshtein distance under 30% of
 * shorter title length), picks the "richer" row (more non-null fields)
 * as the keeper, transfers all InfraUpdate rows from the duplicate(s)
 * onto the keeper, and deletes the duplicate project row.
 *
 * ALWAYS run with --dry-run first. Never auto-runs on cron.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const DISTRICT_SLUG = (() => {
  const i = args.indexOf("--district");
  return i >= 0 ? args[i + 1] : null;
})();

const STOP = new Set(["the", "of", "in", "a", "an", "for", "to", "and", "at", "on", "by", "with", "from"]);
function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    // digits survive even at short length so "2a"/"3" distinguish Metro Line 2A from Line 3
    .filter((w) => (w.length > 2 || /\d/.test(w)) && !STOP.has(w));
}
function tokenOverlap(a: string, b: string): number {
  const ta = new Set(tokens(a)); const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let hits = 0; for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.min(ta.size, tb.size);
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const v0 = new Array(b.length + 1).fill(0);
  const v1 = new Array(b.length + 1).fill(0);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function isDuplicate(a: string, b: string): { reason: string; metric: number } | null {
  // Guard against false positives on Metro Line 2A vs 3 / Phase 1 vs 2.
  const digitsA = new Set(tokens(a).filter((t) => /\d/.test(t)));
  const digitsB = new Set(tokens(b).filter((t) => /\d/.test(t)));
  if (digitsA.size > 0 && digitsB.size > 0) {
    const shared = [...digitsA].some((d) => digitsB.has(d));
    if (!shared) return null;
  }
  const overlap = tokenOverlap(a, b);
  if (overlap >= 0.75) return { reason: "token-overlap", metric: overlap };
  const short = Math.min(a.length, b.length);
  if (short >= 10) {
    const d = levenshtein(a.toLowerCase(), b.toLowerCase());
    if (d / short < 0.15) return { reason: "levenshtein", metric: d / short };
  }
  return null;
}

// "Richness" score — how much real data the row carries. Higher = keep.
function richness(p: {
  announcedBy?: unknown; executingAgency?: unknown; keyPeople?: unknown;
  originalBudget?: unknown; revisedBudget?: unknown; budget?: unknown;
  progressPct?: unknown; sourceUrls?: unknown; lastNewsAt?: unknown;
  verificationCount?: unknown; updatedAt?: Date;
}): number {
  let score = 0;
  if (p.announcedBy) score += 2;
  if (p.executingAgency) score += 1;
  if (Array.isArray(p.keyPeople) && (p.keyPeople as unknown[]).length > 0) score += 2;
  if (p.originalBudget) score += 1;
  if (p.revisedBudget) score += 1;
  if (p.budget) score += 0.5;
  if (p.progressPct != null) score += 0.5;
  if (Array.isArray(p.sourceUrls)) score += (p.sourceUrls as unknown[]).length * 0.3;
  if (p.lastNewsAt) score += 2;
  if (typeof p.verificationCount === "number") score += Math.min(3, p.verificationCount);
  return score;
}

async function main() {
  console.log(`🧹 InfraProject dedup ${DRY_RUN ? "(DRY-RUN)" : ""}  district=${DISTRICT_SLUG ?? "ALL"}\n`);

  const districts = DISTRICT_SLUG
    ? await prisma.district.findMany({ where: { slug: DISTRICT_SLUG }, select: { id: true, slug: true, name: true } })
    : await prisma.district.findMany({ where: { active: true }, select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } });

  let totalMerged = 0;
  let totalChecked = 0;

  for (const d of districts) {
    const projects = await prisma.infraProject.findMany({
      where: { districtId: d.id },
      orderBy: { updatedAt: "desc" },
    });
    if (projects.length < 2) continue;
    totalChecked += projects.length;

    // Greedy: for each pair, if duplicate, merge into the richer one.
    const removed = new Set<string>();
    let merged = 0;
    for (let i = 0; i < projects.length; i++) {
      if (removed.has(projects[i].id)) continue;
      for (let j = i + 1; j < projects.length; j++) {
        if (removed.has(projects[j].id)) continue;
        const dup = isDuplicate(projects[i].name, projects[j].name);
        if (!dup) continue;

        const a = projects[i]; const b = projects[j];
        const keeper = richness(a) >= richness(b) ? a : b;
        const loser = keeper.id === a.id ? b : a;

        console.log(`  [${d.slug}] ${dup.reason} (${dup.metric.toFixed(2)}):`);
        console.log(`     KEEP : ${keeper.name.slice(0, 70)}`);
        console.log(`     DROP : ${loser.name.slice(0, 70)}`);

        if (!DRY_RUN) {
          // Move timeline rows from loser → keeper
          await prisma.infraUpdate.updateMany({
            where: { projectId: loser.id },
            data: { projectId: keeper.id },
          });

          // Merge sourceUrls arrays
          const keeperSrc = Array.isArray(keeper.sourceUrls) ? (keeper.sourceUrls as string[]) : [];
          const loserSrc = Array.isArray(loser.sourceUrls) ? (loser.sourceUrls as string[]) : [];
          const merge = [...new Set([...keeperSrc, ...loserSrc])].slice(-20);

          // Prefer the keeper's data; fill nulls from the loser where helpful
          const fill: Record<string, unknown> = { sourceUrls: merge };
          for (const f of ["announcedBy","announcedByRole","party","executingAgency","originalBudget","revisedBudget","budget","progressPct","startDate","actualStartDate","expectedEnd","originalEndDate","revisedEndDate","cancelledDate","cancellationReason","shortName","scope","contractor"] as const) {
            if ((keeper as unknown as Record<string, unknown>)[f] == null && (loser as unknown as Record<string, unknown>)[f] != null) {
              fill[f] = (loser as unknown as Record<string, unknown>)[f];
            }
          }
          await prisma.infraProject.update({ where: { id: keeper.id }, data: fill });

          await prisma.infraProject.delete({ where: { id: loser.id } });
        }
        removed.add(loser.id);
        merged++;
      }
    }
    if (merged > 0) {
      console.log(`  [${d.slug}] merged ${merged} duplicate rows`);
      totalMerged += merged;
    }
  }

  console.log(`\n📊 Result: scanned ${totalChecked} projects across ${districts.length} districts · merged ${totalMerged}${DRY_RUN ? " (dry-run — no writes)" : ""}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
