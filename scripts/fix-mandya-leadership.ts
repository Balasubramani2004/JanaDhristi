/**
 * JanaDhristi — Mandya leadership re-tier + verification.
 * Run: npx tsx scripts/fix-mandya-leadership.ts [--dry-run]
 *
 * Re-tiers Mandya's leaders to the new 5-tier hierarchy:
 *   T1 NATIONAL          → President, Prime Minister
 *   T2 STATE             → Governor, Chief Minister, key state ministers
 *   T3 DISTRICT ADMIN    → Collector, SP, ZP CEO  (IAS / IPS — no party)
 *   T4 ELECTED REPS      → MP + MLAs (party + constituency required)
 *   T5 MUNICIPAL & DEPT  → Mayor, Municipal Commissioner, Dept heads
 *
 * Hard rules (per spec):
 *   - NEVER fabricate IAS/IPS officer names. If unknown, use a "[Verify at
 *     <official portal>]" placeholder so users know to look it up.
 *   - NEVER guess party — null when unsure (IAS/IPS always null).
 *   - Mark wrong/legacy rows inactive (active=false) — never delete unless
 *     the row is a clear duplicate created by the re-tier itself.
 *   - lastVerifiedAt = now() on every row touched.
 */

import "./_env";
import { PrismaClient, Prisma } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../src/lib/update-log";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DRY_RUN = process.argv.includes("--dry-run");
const NOW = new Date();

interface Spec {
  name: string;
  matchAlt?: string[];
  role: string;
  tier: number;
  party: string | null;
  constituency?: string | null;
  source?: string;
}

const TARGET: Spec[] = [
  // T1 — NATIONAL
  { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
  { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },

  // T2 — STATE (Karnataka)
  { name: "Thaavar Chand Gehlot", matchAlt: ["Thaawarchand Gehlot"], role: "Governor of Karnataka", tier: 2, party: null, source: "manual-research" },
  { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 2, party: "INC", source: "manual-research" },

  // T3 — DISTRICT ADMINISTRATION (IAS/IPS — placeholder names if unknown)
  { name: "[Verify at mandya.nic.in]", role: "District Collector, Mandya", tier: 3, party: null, source: "manual-research" },
  { name: "[Verify at ksp.gov.in]", role: "Superintendent of Police, Mandya", tier: 3, party: null, source: "manual-research" },
  { name: "[Verify at mandya.nic.in]", role: "CEO, Zilla Panchayat, Mandya", tier: 3, party: null, source: "manual-research" },

  // T4 — ELECTED REPRESENTATIVES
  { name: "H.D. Kumaraswamy", matchAlt: ["Kumaraswamy"], role: "Union Minister for Heavy Industries & Steel; MP, Mandya", tier: 4, party: "JD(S)", constituency: "Mandya (Lok Sabha)", source: "manual-research" },

  // MLAs: role re-derived from each row's existing constituency in the DB
  // (ECI 2023 source-of-truth) at apply time so we never overwrite a correct
  // constituency with a hand-written one. Party + tier still asserted here.
  { name: "N. Chauvarayaswamy", matchAlt: ["Chauvarayaswamy"], role: "MLA", tier: 4, party: "INC", source: "manual-research" },
  { name: "D.C. Thammanna", role: "MLA", tier: 4, party: "INC", source: "manual-research" },
  { name: "Darshan Puttannaiah", role: "MLA", tier: 4, party: "SKP", source: "manual-research" },
  { name: "Narasimha Nayak", role: "MLA", tier: 4, party: "INC", source: "manual-research" },
  { name: "P. Ravikumar (Ganiga)", matchAlt: ["P. Ravikumar", "Ravikumar Ganiga"], role: "MLA", tier: 4, party: "INC", source: "manual-research" },
  { name: "A.B. Ramesh Bandisiddegowda", matchAlt: ["Ramesh Bandisiddegowda"], role: "MLA", tier: 4, party: "INC", source: "manual-research" },
  { name: "P.M. Narendraswamy", matchAlt: ["Narendraswamy"], role: "MLA", tier: 4, party: "INC", source: "manual-research" },
];

// MLA roles are re-derived from the row's existing constituency: "MLA, <constituency>".
// This keeps the user-facing role consistent without ever overriding the
// authoritative ECI constituency value.
function deriveRole(spec: Spec, existingConstituency: string | null | undefined): string {
  if (spec.role !== "MLA") return spec.role;
  const c = (existingConstituency ?? "").split("—")[0].trim();
  return c ? `MLA, ${c}` : "MLA";
}

async function findMatch(districtId: string, spec: Spec) {
  // Placeholder names like "[Verify at …]" are intentionally reused across
  // multiple roles; only match if BOTH name AND role agree.
  const isPlaceholder = spec.name.startsWith("[");
  const tokens = [spec.name, ...(spec.matchAlt ?? [])];
  for (const t of tokens) {
    const where: Prisma.LeaderWhereInput = { districtId, name: { contains: t, mode: "insensitive" } };
    if (isPlaceholder) where.role = { contains: spec.role.split(",")[0].trim(), mode: "insensitive" };
    const row = await prisma.leader.findFirst({
      where,
      orderBy: { lastVerifiedAt: { sort: "desc", nulls: "last" } },
    });
    if (row) return row;
  }
  // Fallback: match by role substring (catches legacy "Member of Legislative Assembly" → MLA)
  const roleKey = spec.role.split(",")[0].trim();
  return prisma.leader.findFirst({
    where: { districtId, name: { contains: spec.name.split(/[ .]/)[0], mode: "insensitive" }, role: { contains: roleKey, mode: "insensitive" } },
  });
}

async function main() {
  console.log(`🛠  Mandya leadership re-tier ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  const d = await prisma.district.findFirst({ where: { slug: "mandya" }, select: { id: true, name: true } });
  if (!d) throw new Error("Mandya not found");

  let updated = 0, added = 0, retired = 0;

  // Stage 1 — apply each spec (UPDATE if matched, CREATE otherwise).
  for (const spec of TARGET) {
    const existing = await findMatch(d.id, spec);
    if (existing) {
      const data: Prisma.LeaderUpdateInput = {
        name: spec.name,
        role: deriveRole(spec, existing.constituency),
        tier: spec.tier,
        party: spec.party,
        // Preserve DB constituency (authoritative ECI value); only fill if empty.
        constituency: existing.constituency ?? spec.constituency ?? null,
        source: spec.source ?? existing.source ?? "manual-research",
        active: true,
        lastVerifiedAt: NOW,
      };
      console.log(`✏  UPDATE T${existing.tier}→T${spec.tier} | ${existing.name} | ${existing.role} → ${spec.name} | ${spec.role}`);
      if (!DRY_RUN) {
        await prisma.leader.update({ where: { id: existing.id }, data });
        await logUpdate({
          source: "api", actorLabel: "manual-research",
          tableName: "Leader", recordId: existing.id, action: "update",
          districtId: d.id, districtName: d.name, moduleName: "leadership",
          description: `Mandya leadership re-tier: ${existing.name} (${existing.role}) → T${spec.tier} ${spec.role}`,
          recordCount: 1, details: { fromTier: existing.tier, toTier: spec.tier },
        });
      }
      updated++;
    } else {
      console.log(`✅ ADD T${spec.tier} | ${spec.name} | ${spec.role} | ${spec.party ?? "—"}`);
      if (!DRY_RUN) {
        const created = await prisma.leader.create({
          data: {
            districtId: d.id, name: spec.name, role: spec.role, tier: spec.tier,
            party: spec.party, constituency: spec.constituency ?? null,
            source: spec.source ?? "manual-research", active: true, lastVerifiedAt: NOW,
          },
        });
        await logUpdate({
          source: "api", actorLabel: "manual-research",
          tableName: "Leader", recordId: created.id, action: "create",
          districtId: d.id, districtName: d.name, moduleName: "leadership",
          description: `Mandya leadership add: ${spec.name} as ${spec.role} (T${spec.tier})`,
          recordCount: 1, details: {},
        });
      }
      added++;
    }
  }

  // Stage 2 — retire legacy MLA rows that we just superseded by name+role.
  // Any row whose role starts with "Member of Legislative Assembly" and is
  // still on tier 2 wasn't matched by Stage 1 (because Stage 1 promoted it
  // to T4) — but defensively mark any leftover tier-2 MLA rows inactive.
  const stragglers = await prisma.leader.findMany({
    where: {
      districtId: d.id,
      tier: 2,
      role: { contains: "Member of Legislative Assembly", mode: "insensitive" },
      active: true,
    },
    select: { id: true, name: true, role: true },
  });
  for (const s of stragglers) {
    console.log(`📜 RETIRE: ${s.name} | ${s.role} (legacy tier-2 MLA row)`);
    if (!DRY_RUN) {
      await prisma.leader.update({ where: { id: s.id }, data: { active: false, lastVerifiedAt: NOW } });
      await logUpdate({
        source: "api", actorLabel: "manual-research",
        tableName: "Leader", recordId: s.id, action: "update",
        districtId: d.id, districtName: d.name, moduleName: "leadership",
        description: `Mandya leadership retired duplicate: ${s.name} (${s.role}) marked inactive — superseded by re-tiered MLA row.`,
        recordCount: 1, details: { reason: "duplicate-after-retier" },
      });
    }
    retired++;
  }

  console.log(`\nSummary: ${updated} updated · ${added} added · ${retired} retired`);

  // Final coverage table
  const rows = await prisma.leader.findMany({ where: { districtId: d.id, active: true }, orderBy: [{ tier: "asc" }, { name: "asc" }] });
  console.log(`\n📊 Mandya active leaders (${rows.length}):`);
  for (const r of rows) console.log(`  T${r.tier} | ${r.name} | ${r.role} | ${r.party ?? "—"} | ${r.constituency ?? ""}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
