/**
 * Seed curated tourism rows for Karnataka pilot districts.
 * Run: npx tsx prisma/seed-tourism-karnataka.ts
 * Requires TourismPlace table (prisma db push or migrate).
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = makeClient();
  const ka = await prisma.state.findUnique({ where: { slug: "karnataka" } });
  if (!ka) {
    console.error("Karnataka state not found — run main seed first.");
    process.exit(1);
  }

  const rows: Array<{
    slug: string;
    places: Array<{
      name: string;
      nameLocal?: string;
      category: string;
      description: string;
      latitude?: number;
      longitude?: number;
      externalUrl?: string;
      source: string;
      sortOrder: number;
    }>;
  }> = [
    {
      slug: "mandya",
      places: [
        {
          name: "Srirangapatna",
          nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",
          category: "heritage",
          description: "Island town on the Kaveri with Tipu Sultan's fort, Ranganathaswamy Temple, and Dariya Daulat Bagh.",
          latitude: 12.4217,
          longitude: 76.6936,
          externalUrl: "https://en.wikipedia.org/wiki/Srirangapatna",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 1,
        },
        {
          name: "KRS Dam & Brindavan Gardens",
          nameLocal: "ಕೆ.ಆರ್.ಎಸ್. ಅಣೆಕಟ್ಟು",
          category: "nature",
          description: "Krishna Raja Sagara dam and terraced gardens — a major irrigation and visitor landmark.",
          latitude: 12.425,
          longitude: 76.5736,
          externalUrl: "https://karnatakatourism.org/",
          source: "Karnataka Tourism / public domain facts",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "mysuru",
      places: [
        {
          name: "Mysore Palace",
          nameLocal: "ಮೈಸೂರು ಅರಮನೆ",
          category: "heritage",
          description: "Seat of the Wadiyar dynasty and one of India's most visited palace complexes.",
          latitude: 12.3051,
          longitude: 76.6552,
          externalUrl: "https://en.wikipedia.org/wiki/Mysore_Palace",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 1,
        },
        {
          name: "Chamundi Hill",
          nameLocal: "ಚಾಮುಂಡಿ ಬೆಟ್ಟ",
          category: "pilgrimage",
          description: "Hilltop Chamundeshwari Temple with views over Mysuru.",
          latitude: 12.2724,
          longitude: 76.6708,
          externalUrl: "https://en.wikipedia.org/wiki/Chamundeshwari_Temple",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 2,
        },
        {
          name: "Nagarahole National Park",
          nameLocal: "ನಾಗರಹೊಳೆ ರಾಷ್ಟ್ರೀಯ ಉದ್ಯಾನ",
          category: "wildlife",
          description: "Tiger reserve and wildlife tourism destination partly in Mysuru district.",
          latitude: 12.0467,
          longitude: 76.1264,
          externalUrl: "https://en.wikipedia.org/wiki/Nagarhole_National_Park",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 3,
        },
      ],
    },
    {
      slug: "bengaluru-urban",
      places: [
        {
          name: "Lalbagh Botanical Garden",
          nameLocal: "ಲಾಲ್‌ಬಾಗ್",
          category: "nature",
          description: "Historic botanical garden with the Glass House and centuries-old rock formations.",
          latitude: 12.9507,
          longitude: 77.5848,
          externalUrl: "https://en.wikipedia.org/wiki/Lal_Bagh",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 1,
        },
        {
          name: "Bangalore Palace",
          nameLocal: "ಬೆಂಗಳೂರು ಅರಮನೆ",
          category: "heritage",
          description: "Tudor-style palace and events venue modelled on Windsor Castle.",
          latitude: 12.9987,
          longitude: 77.5921,
          externalUrl: "https://en.wikipedia.org/wiki/Bangalore_Palace",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 2,
        },
        {
          name: "Cubbon Park",
          nameLocal: "ಕಬ್ಬನ್ ಪಾರ್ಕ್",
          category: "nature",
          description: "Central green lung with avenues, museums, and the State Central Library.",
          latitude: 12.9763,
          longitude: 77.5929,
          externalUrl: "https://en.wikipedia.org/wiki/Cubbon_Park",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 3,
        },
      ],
    },
  ];

  for (const { slug, places } of rows) {
    const d = await prisma.district.findUnique({
      where: { stateId_slug: { stateId: ka.id, slug } },
    });
    if (!d) {
      console.warn(`Skip tourism seed — district not found: ${slug}`);
      continue;
    }
    const existing = await prisma.tourismPlace.count({ where: { districtId: d.id } });
    if (existing > 0) {
      console.log(`Tourism already seeded for ${slug} (${existing} rows) — skip.`);
      continue;
    }
    await prisma.tourismPlace.createMany({
      data: places.map((p) => ({ ...p, districtId: d.id })),
    });
    console.log(`Seeded ${places.length} tourism places for ${slug}.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
