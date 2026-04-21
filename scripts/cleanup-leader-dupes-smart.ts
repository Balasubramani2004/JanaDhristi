/**
 * JanaDhristi — Smart leader deduplication
 * Handles: role echoes, junk group names, name+tier duplicates
 * Marks inactive instead of deleting (preserves history).
 * Safe to rerun.
 *
 * Usage: npx tsx scripts/cleanup-leader-dupes-smart.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

// Names that are just role titles echoed as person names
const ROLE_ECHO_RE =
  /^(prime minister|president|governor|chief minister|deputy chief minister|minister|speaker|collector|commissioner|mayor|mla|mp|judge|officer|secretary|chairman|director|superintendent|inspector|mlc)$/i;

// Group/party names misidentified as person names
const JUNK_NAME_RE =
  /^(karnataka|maharashtra|delhi|bengal|tamil|telangana|uttar)\s+(congress|bjp|aap|tmc|tdp|jds|inc)\s*(mla|mp|leader|member)/i;

async function main() {
  console.log("Smart leader deduplication...\n");

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  });

  let totalRemoved = 0;
  let totalDeduped = 0;
  let totalJunk = 0;

  for (const d of districts) {
    const leaders = await prisma.leader.findMany({
      where: { districtId: d.id, active: true },
      select: { id: true, name: true, role: true, party: true, tier: true },
      orderBy: [{ tier: "asc" }, { id: "desc" }], // newest first
    });

    const toDeactivate: string[] = [];

    // 1. Remove role-echo names and junk group names
    for (const l of leaders) {
      const nameTrimmed = l.name.trim();
      if (ROLE_ECHO_RE.test(nameTrimmed)) {
        toDeactivate.push(l.id);
        totalJunk++;
        console.log(`  JUNK (role echo): ${d.slug} | "${l.name}" | ${l.role}`);
      } else if (JUNK_NAME_RE.test(nameTrimmed)) {
        toDeactivate.push(l.id);
        totalJunk++;
        console.log(`  JUNK (group name): ${d.slug} | "${l.name}" | ${l.role}`);
      }
    }

    // 2. Deduplicate by name+tier (keep newest by id DESC, deactivate older)
    const remaining = leaders.filter((l) => !toDeactivate.includes(l.id));
    const seen = new Map<string, { id: string; role: string }>();
    for (const l of remaining) {
      const key = l.name.toLowerCase().trim() + "|" + l.tier;
      if (seen.has(key)) {
        toDeactivate.push(l.id);
        totalDeduped++;
        const kept = seen.get(key)!;
        console.log(
          `  DUPE: ${d.slug} | "${l.name}" as "${l.role}" (${l.party ?? "-"}) → keeping "${kept.role}"`
        );
      } else {
        seen.set(key, { id: l.id, role: l.role ?? "" });
      }
    }

    if (toDeactivate.length > 0) {
      await prisma.leader.updateMany({
        where: { id: { in: toDeactivate } },
        data: { active: false },
      });
      totalRemoved += toDeactivate.length;
    }
  }

  console.log(
    `\n✅ Total marked inactive: ${totalRemoved} (${totalDeduped} dupes + ${totalJunk} junk)`
  );

  // Show final counts
  console.log("\n--- Final active leader counts ---");
  for (const d of districts) {
    const count = await prisma.leader.count({
      where: { districtId: d.id, active: true },
    });
    console.log(`  ${d.slug}: ${count} active leaders`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
