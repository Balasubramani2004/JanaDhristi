/**
 * JanaDhristi — Update feature wording (preserves votes)
 * JanaDhristi — MIT License with Attribution.
 *
 * Safe to run multiple times (idempotent).
 * Never deletes or recreates records — only updates existing ones.
 *
 * Usage: npx tsx scripts/update-feature-wording.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

type FeatureUpdate = {
  oldTitle: string;
  newTitle: string;
  newDescription: string;
  newIcon?: string;
  newCategory?: string;
};

const UPDATES: FeatureUpdate[] = [
  {
    oldTitle: "Corruption & Fund Leakage Tracker",
    newTitle: "Budget Utilization Tracker",
    newDescription:
      "See how public money is allocated vs actually spent across government projects. Track budget utilization rates and identify under-utilized funds — all from official government budget documents.",
    newIcon: "💰",
    newCategory: "Transparency",
  },
  {
    oldTitle: "MP/MLA Report Card",
    newTitle: "Elected Representative Dashboard",
    newDescription:
      "Track every elected representative: projects delivered, budget utilized, attendance in Parliament/Assembly, and progress on announced initiatives — all sourced from official records.",
    newIcon: "📋",
    newCategory: "Data",
  },
  {
    oldTitle: "Public Service Delivery Timer",
    newTitle: "Public Service Delivery Times",
    newDescription:
      "Track real-world timelines for common citizen services — caste certificates, ration cards, building permits, licence renewals — based on citizen-reported data.",
    newIcon: "⏱️",
    newCategory: "Transparency",
  },
  {
    oldTitle: "Compare Districts Side-by-Side",
    newTitle: "Compare Districts Side-by-Side",
    newDescription:
      "Compare any 2-3 districts on literacy, budget, infrastructure, and health metrics. Understand governance patterns across regions based on official government data.",
    newIcon: "📊",
    newCategory: "Data",
  },
];

async function main() {
  console.log("🔄 Updating feature wording (votes preserved)...\n");
  let updated = 0;
  let notFound = 0;
  let alreadyNew = 0;

  for (const u of UPDATES) {
    // Try matching OLD title first
    let existing = await prisma.featureRequest.findFirst({
      where: { title: u.oldTitle },
    });

    if (!existing) {
      // Fallback: maybe already renamed — match NEW title
      existing = await prisma.featureRequest.findFirst({
        where: { title: u.newTitle },
      });
      if (existing) {
        alreadyNew++;
        console.log(`⏭  "${u.newTitle}" already renamed — updating description only`);
        await prisma.featureRequest.update({
          where: { id: existing.id },
          data: {
            description: u.newDescription,
            ...(u.newIcon ? { icon: u.newIcon } : {}),
            ...(u.newCategory ? { category: u.newCategory } : {}),
          },
        });
        continue;
      }
      notFound++;
      console.log(`⚠️  Not found in DB: "${u.oldTitle}" — SKIPPING`);
      continue;
    }

    await prisma.featureRequest.update({
      where: { id: existing.id },
      data: {
        title: u.newTitle,
        description: u.newDescription,
        ...(u.newIcon ? { icon: u.newIcon } : {}),
        ...(u.newCategory ? { category: u.newCategory } : {}),
      },
    });
    updated++;
    console.log(
      `✅ "${u.oldTitle}" → "${u.newTitle}" (votes: ${existing.votes} preserved)`
    );
  }

  console.log(
    `\n📊 Summary: ${updated} renamed, ${alreadyNew} description-only updates, ${notFound} not found\n`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
