/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Fix Hyderabad Crop Prices — Remove invalid commodities + round prices
// Run: npx tsx scripts/fix-hyderabad-crops.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌾 Fixing Hyderabad crop price data...\n");

  const telangana = await prisma.state.findUnique({ where: { slug: "telangana" } });
  if (!telangana) throw new Error("Telangana not found");

  const district = await prisma.district.findFirst({
    where: { slug: "hyderabad", stateId: telangana.id },
  });
  if (!district) throw new Error("Hyderabad not found");

  const did = district.id;

  // ═══ 1. Delete invalid commodities (Apple, Avocado — not traded at Hyderabad APMC) ═══
  const invalidCommodities = ["Apple", "Avocado"];
  for (const commodity of invalidCommodities) {
    const deleted = await prisma.cropPrice.deleteMany({
      where: { districtId: did, commodity },
    });
    if (deleted.count > 0) {
      console.log(`  ✓ Deleted ${deleted.count} "${commodity}" records`);
    } else {
      console.log(`  ⏭ No "${commodity}" records found`);
    }
  }

  // ═══ 2. Round all crop prices to integers ═══
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
  console.log(`  ✓ Rounded prices for ${rounded} crop records`);

  console.log("\n🎉 Crop price fixes complete!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
