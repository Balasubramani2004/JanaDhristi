// ═══════════════════════════════════════════════════════════
// Script: Opus fact-check all famous personalities
// Rule: must be BORN in the listed district. Remove if not.
// Usage: npx tsx scripts/fact-check-personalities.ts
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { callAI } from "../src/lib/ai-provider";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const people = await prisma.famousPersonality.findMany({
    include: { district: { include: { state: true } } },
    orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
  });

  console.log(`\n🔍 Fact-checking ${people.length} personalities...\n`);

  // Group by district
  const byDistrict = new Map<string, typeof people>();
  for (const p of people) {
    const key = p.district.id;
    if (!byDistrict.has(key)) byDistrict.set(key, []);
    byDistrict.get(key)!.push(p);
  }

  let totalChecked = 0;
  let totalRemoved = 0;
  let totalKept = 0;

  for (const [, batch] of byDistrict) {
    const district = batch[0].district;
    console.log(`\n── ${district.name} (${district.state.name}) — ${batch.length} personalities ──`);

    const prompt = `You are verifying famous personalities for a civic transparency website.
STRICT RULE: A person must be BORN in ${district.name} district, ${district.state.name}, India to be listed there.
Working/living/studying/associated is NOT sufficient — only birth counts.

Known fact: Dr. Rajkumar (Kannada actor) was born in Gajanur, Erode district, Tamil Nadu — NOT Karnataka.
Known fact: Ambareesh was born in Devarayanadurga, Tumkur district — NOT Mandya.
Known fact: H.D. Deve Gowda was born in Haradanahalli, Hassan district — NOT Mandya.

Verify each person:
${batch.map((p, i) => `${i + 1}. ${p.name} | DB birthPlace: "${p.birthPlace ?? "unknown"}" | ${p.birthYear ?? "?"}–${p.deathYear ?? "present"}`).join("\n")}

For each, respond with the TRUE birth place and whether they should stay listed under ${district.name}.
If the person is an institution (like a palace, company, festival), check if it was established/founded in ${district.name}.

Return ONLY a JSON array (no markdown):
[{"index":1,"name":"...","trueBirthPlace":"...","bornInDistrict":true,"reason":"..."}]`;

    const response = await callAI({
      systemPrompt: "You are a strict fact-checker. Return ONLY valid JSON arrays. No markdown, no explanation.",
      userPrompt: prompt,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.1,
    });

    let results: Array<{
      index: number;
      name: string;
      trueBirthPlace: string;
      bornInDistrict: boolean;
      reason: string;
    }>;

    try {
      const text = response.text.trim().replace(/```(?:json)?\n?/g, "").trim();
      results = JSON.parse(text);
    } catch (e) {
      console.error(`  ⚠️ JSON parse failed for ${district.name}:`, e);
      continue;
    }

    for (const result of results) {
      const person = batch[result.index - 1];
      if (!person) continue;
      totalChecked++;

      if (!result.bornInDistrict) {
        console.log(`  ❌ REMOVING: ${result.name} — actually from ${result.trueBirthPlace} (${result.reason})`);
        await prisma.famousPersonality.delete({ where: { id: person.id } });
        totalRemoved++;
      } else {
        console.log(`  ✅ ${result.name} — ${result.trueBirthPlace}`);
        // Update birthPlace if we have better info
        if (result.trueBirthPlace && result.trueBirthPlace !== person.birthPlace) {
          await prisma.famousPersonality.update({
            where: { id: person.id },
            data: { birthPlace: result.trueBirthPlace },
          });
        }
        totalKept++;
      }
    }

    await sleep(3000);
  }

  console.log(`
═══════════════════════════════════════════════
  FACT-CHECK RESULTS
═══════════════════════════════════════════════
  Total checked: ${totalChecked}
  ✅ Kept (born in district): ${totalKept}
  ❌ Removed (wrong district): ${totalRemoved}
═══════════════════════════════════════════════`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
