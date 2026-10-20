// ═══════════════════════════════════════════════════════════
// Script: Fix taluk data — add villages + population via Opus
// Usage: npx tsx scripts/fix-taluk-data.ts
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { callAI } from "../src/lib/ai-provider";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const taluks = await prisma.taluk.findMany({
    include: {
      district: { include: { state: true } },
      _count: { select: { villages: true } },
    },
    orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
  });

  console.log("\n═══ TALUK DATA STATUS ═══");
  let needFix = 0;
  for (const t of taluks) {
    const ok = t._count.villages > 0 && t.population;
    const status = ok ? "✅" : "❌";
    console.log(`${status} ${t.district.name} → ${t.name} — ${t._count.villages} villages, pop: ${t.population ?? 0}`);
    if (!ok) needFix++;
  }

  if (needFix === 0) {
    console.log("\n✅ All taluks already have village + population data.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🔧 Fixing ${needFix} taluks...\n`);

  for (const taluk of taluks) {
    if (taluk._count.villages > 0 && taluk.population) continue;

    const { district } = taluk;
    process.stdout.write(`  ${district.name} → ${taluk.name}... `);

    const prompt = `Provide accurate data for ${taluk.name} taluk in ${district.name} district, ${district.state.name}, India.

Return ONLY this JSON (no markdown):
{
  "talukPopulation": 150000,
  "talukArea": 456.7,
  "villages": [
    {"name": "Village Name", "nameLocal": "ಕನ್ನಡ", "population": 1234, "pincode": "571401"}
  ]
}

Requirements:
- talukPopulation: 2011 Census population for this taluk
- talukArea: area in sq km
- villages: 12-15 REAL villages in this taluk (from census/Wikipedia)
- nameLocal: Kannada script name if known, else same as name
- population: approximate village population (2011)
- pincode: real pincode if known, else null`;

    const response = await callAI({
      systemPrompt: "You are a geographic data expert for India. Return ONLY valid JSON with real data.",
      userPrompt: prompt,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.1,
    });

    try {
      const text = response.text.trim().replace(/```(?:json)?\n?/g, "").trim();
      const data = JSON.parse(text) as {
        talukPopulation: number;
        talukArea: number;
        villages: Array<{ name: string; nameLocal?: string; population?: number; pincode?: string }>;
      };

      // Update taluk
      await prisma.taluk.update({
        where: { id: taluk.id },
        data: {
          population: data.talukPopulation || taluk.population,
          area: data.talukArea || taluk.area,
          villageCount: data.villages.length,
        },
      });

      // Upsert villages
      let added = 0;
      for (const v of data.villages) {
        if (!v.name) continue;
        const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        try {
          await prisma.village.upsert({
            where: { talukId_slug: { talukId: taluk.id, slug } },
            create: {
              talukId: taluk.id,
              name: v.name,
              nameLocal: v.nameLocal || null,
              slug,
              population: v.population || null,
              pincode: v.pincode || null,
            },
            update: {},
          });
          added++;
        } catch { /* skip duplicate */ }
      }

      process.stdout.write(`✓ (${added} villages, pop ${data.talukPopulation?.toLocaleString()})\n`);
    } catch (e) {
      process.stdout.write(`✗ (parse error: ${e})\n`);
    }

    await sleep(2500);
  }

  // Final status
  console.log("\n═══ FINAL STATUS ═══");
  const updated = await prisma.taluk.findMany({
    include: {
      district: true,
      _count: { select: { villages: true } },
    },
    orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
  });

  for (const t of updated) {
    const ok = t._count.villages > 0 && t.population;
    console.log(`${ok ? "✅" : "❌"} ${t.district.name} → ${t.name} — ${t._count.villages} villages, pop: ${t.population?.toLocaleString() ?? 0}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
