import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const people = await prisma.famousPersonality.findMany({
    include: { district: { include: { state: true } } },
    orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
  });
  console.log(`Total personalities: ${people.length}`);
  for (const p of people) {
    console.log(`  ${p.district.name} | ${p.name} | born: ${p.birthPlace ?? "unknown"} | ${p.birthYear ?? "?"}–${p.deathYear ?? "present"}`);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
