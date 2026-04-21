/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Fix Lucknow Crop Prices — Round decimals to whole numbers
// Run: npx tsx scripts/fix-lucknow-crops.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌾 Fixing Lucknow crop price decimals...\n");

  const up = await prisma.state.findUnique({ where: { slug: "uttar-pradesh" } });
  if (!up) throw new Error("Uttar Pradesh not found");

  const district = await prisma.district.findFirst({
    where: { slug: "lucknow", stateId: up.id },
  });
  if (!district) throw new Error("Lucknow not found");

  const did = district.id;

  const crops = await prisma.cropPrice.findMany({ where: { districtId: did } });
  let rounded = 0;
  for (const c of crops) {
    const roundedMin = Math.round(c.minPrice);
    const roundedMax = Math.round(c.maxPrice);
    const roundedModal = Math.round(c.modalPrice);

    if (roundedMin !== c.minPrice || roundedMax !== c.maxPrice || roundedModal !== c.modalPrice) {
      await prisma.cropPrice.update({
        where: { id: c.id },
        data: {
          minPrice: roundedMin,
          maxPrice: roundedMax,
          modalPrice: roundedModal,
        },
      });
      rounded++;
    }
  }
  console.log(`  ✓ Rounded prices for ${rounded} of ${crops.length} crop records`);
  console.log("\n🎉 Lucknow crop price fix complete!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
