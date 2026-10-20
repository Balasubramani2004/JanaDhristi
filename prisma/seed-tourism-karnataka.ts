/**
 * Seed curated tourism rows for Karnataka pilot districts.
 * Run: npx tsx prisma/seed-tourism-karnataka.ts
 * Requires TourismPlace table (prisma db push or migrate).
 * Idempotent: upserts by district + place name so re-runs add updates without duplicates.
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type PlaceSeed = {
  name: string;
  nameLocal?: string;
  category: string;
  description: string;
  latitude?: number;
  longitude?: number;
  externalUrl?: string;
  source: string;
  sortOrder: number;
};

async function upsertPlace(prisma: PrismaClient, districtId: string, p: PlaceSeed) {
  const existing = await prisma.tourismPlace.findFirst({
    where: { districtId, name: p.name },
  });
  const data = {
    nameLocal: p.nameLocal ?? null,
    category: p.category,
    description: p.description,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    externalUrl: p.externalUrl ?? null,
    source: p.source,
    sortOrder: p.sortOrder,
  };
  if (existing) {
    await prisma.tourismPlace.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.tourismPlace.create({
      data: { ...p, districtId },
    });
  }
}

async function main() {
  const prisma = makeClient();
  const ka = await prisma.state.findUnique({ where: { slug: "karnataka" } });
  if (!ka) {
    console.error("Karnataka state not found — run main seed first.");
    process.exit(1);
  }

  const rows: Array<{ slug: string; places: PlaceSeed[] }> = [
    {
      slug: "mandya",
      places: [
        {
          name: "Srirangapatna",
          nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",
          category: "heritage",
          description:
            "Island town on the Kaveri with Tipu Sultan's fort, Ranganathaswamy Temple, and Dariya Daulat Bagh.",
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
          description:
            "Krishna Raja Sagara dam and terraced gardens — a major irrigation and visitor landmark.",
          latitude: 12.425,
          longitude: 76.5736,
          externalUrl: "https://en.wikipedia.org/wiki/Krishna_Raja_Sagara",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 2,
        },
        {
          name: "Shivanasamudra Falls",
          nameLocal: "ಶಿವನಸಮುದ್ರ ಜಲಪಾತ",
          category: "nature",
          description:
            "Twin segmented waterfalls (Gaganachukki and Bharachukki) on the Kaveri — among India's highest-volume falls.",
          latitude: 12.2942,
          longitude: 77.1678,
          externalUrl: "https://en.wikipedia.org/wiki/Shivanasamudra_Falls",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 3,
        },
        {
          name: "Melukote Cheluvanarayana Swamy Temple",
          nameLocal: "ಮೇಲುಕೋಟೆ ಚೆಲುವನಾರಾಯಣಸ್ವಾಮಿ ದೇವಸ್ಥಾನ",
          category: "pilgrimage",
          description:
            "Hill town known for the Cheluvanarayana Swamy Temple, yoga-narasimha shrine, and the annual Vairamudi festival.",
          latitude: 12.6489,
          longitude: 76.6486,
          externalUrl: "https://en.wikipedia.org/wiki/Melukote",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 4,
        },
        {
          name: "Maddur",
          nameLocal: "ಮದ್ದೂರು",
          category: "heritage",
          description:
            "Historic town on the Bengaluru–Mysuru corridor, known for Maddur vade and Kaveri riverine scenery.",
          latitude: 12.5828,
          longitude: 77.0414,
          externalUrl: "https://en.wikipedia.org/wiki/Maddur,_Mandya",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 5,
        },
        {
          name: "Pandavapura",
          nameLocal: "ಪಾಂಡವಪುರ",
          category: "heritage",
          description:
            "Town linked to Mahabharata lore and the Kaveri; nearby hills and tank landscapes draw day visitors.",
          latitude: 12.495,
          longitude: 76.6744,
          externalUrl: "https://en.wikipedia.org/wiki/Pandavapura",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 6,
        },
        {
          name: "Ranganathittu Bird Sanctuary",
          nameLocal: "ರಂಗನತಿಟ್ಟು ಪಕ್ಷಿಧಾಮ",
          category: "wildlife",
          description:
            "Islets on the Kaveri near Srirangapatna — nesting site for storks, pelicans, and migratory birds (partly in Mandya vicinity).",
          latitude: 12.4244,
          longitude: 76.6581,
          externalUrl: "https://en.wikipedia.org/wiki/Ranganathittu_Bird_Sanctuary",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 7,
        },
        {
          name: "Kikkeri",
          nameLocal: "ಕಿಕ್ಕೇರಿ",
          category: "pilgrimage",
          description:
            "Village with the historic Brahmeshvara Temple (Hoysala-era architecture) — a quiet heritage stop in the district.",
          latitude: 12.465,
          longitude: 76.612,
          externalUrl: "https://en.wikipedia.org/wiki/Kikkeri",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 8,
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
        {
          name: "Mysuru Zoo (Sri Chamarajendra Zoological Gardens)",
          nameLocal: "ಮೈಸೂರು ಪ್ರಾಣಿಸಂಗ್ರಹಾಲಯ",
          category: "wildlife",
          description:
            "One of India's oldest zoos — large enclosures, conservation breeding, and a landmark near the palace.",
          latitude: 12.3056,
          longitude: 76.6644,
          externalUrl: "https://en.wikipedia.org/wiki/Mysore_Zoo",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 4,
        },
        {
          name: "Jaganmohan Palace",
          nameLocal: "ಜಗನ್ಮೋಹನ ಅರಮನೆ",
          category: "museum",
          description: "19th-century palace housing the Jayachamarajendra Art Gallery with Raja Ravi Varma works.",
          latitude: 12.2989,
          longitude: 76.6556,
          externalUrl: "https://en.wikipedia.org/wiki/Jaganmohan_Palace",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 5,
        },
        {
          name: "Railway Museum Mysuru",
          nameLocal: "ರೈಲ್ವೆ ಸಂಗ್ರಹಾಲಯ ಮೈಸೂರು",
          category: "museum",
          description: "Outdoor rail heritage museum with royal saloons and steam locomotives.",
          latitude: 12.313,
          longitude: 76.649,
          externalUrl: "https://en.wikipedia.org/wiki/Railway_Museum_Mysore",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 6,
        },
        {
          name: "St. Philomena's Cathedral",
          nameLocal: "ಸೇಂಟ್ ಫಿಲೋಮಿನಾ ಕ್ಯಾಥೆಡ್ರಲ್",
          category: "heritage",
          description: "Neo-Gothic twin-spire church — one of Asia's tallest church buildings of its style.",
          latitude: 12.3217,
          longitude: 76.6553,
          externalUrl: "https://en.wikipedia.org/wiki/St._Philomena's_Cathedral,_Mysore",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 7,
        },
        {
          name: "Karanji Lake Nature Park",
          nameLocal: "ಕಾರಂಜಿ ಕೆರೆ",
          category: "nature",
          description: "Largest lake in Mysuru city with aviary, butterfly park, and boating — adjacent to the zoo.",
          latitude: 12.3028,
          longitude: 76.6656,
          externalUrl: "https://en.wikipedia.org/wiki/Karanji_Lake",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 8,
        },
        {
          name: "Kabini Reservoir & Backwaters",
          nameLocal: "ಕಾಬಿನಿ ಜಲಾಶಯ",
          category: "nature",
          description:
            "River Kabini backwaters near Nagarahole — popular for wildlife safaris, coracle rides, and riverside stays.",
          latitude: 11.83,
          longitude: 76.35,
          externalUrl: "https://en.wikipedia.org/wiki/Kabini_River",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 9,
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
        {
          name: "Vidhana Soudha",
          nameLocal: "ವಿಧಾನಸೌಧ",
          category: "heritage",
          description: "Seat of Karnataka's legislature — iconic neo-Dravidian civic architecture.",
          latitude: 12.9797,
          longitude: 77.5907,
          externalUrl: "https://en.wikipedia.org/wiki/Vidhana_Soudha",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 4,
        },
        {
          name: "ISKCON Temple Bangalore",
          nameLocal: "ಇಸ್ಕಾನ್ ದೇವಾಲಯ",
          category: "pilgrimage",
          description: "Hilltop Radha-Krishna temple complex with cultural exhibits and views over the city.",
          latitude: 13.0098,
          longitude: 77.5511,
          externalUrl: "https://en.wikipedia.org/wiki/ISKCON_Temple,_Bangalore",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 5,
        },
        {
          name: "Bannerghatta Biological Park",
          nameLocal: "ಬನ್ನೇರುಘಟ್ಟ ಜೈವಿಕ ಉದ್ಯಾನ",
          category: "wildlife",
          description: "Zoo, safari, butterfly park, and rescue centre on the city's southern edge.",
          latitude: 12.8003,
          longitude: 77.5774,
          externalUrl: "https://en.wikipedia.org/wiki/Bannerghatta_Biological_Park",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 6,
        },
        {
          name: "Tipu Sultan's Summer Palace",
          nameLocal: "ಟಿಪ್ಪು ಸುಲ್ತಾನ್ ಬೇಸಿಗೆ ಅರಮನೆ",
          category: "heritage",
          description: "Indo-Islamic teak palace with ornate balconies — museum on Tipu's life and Hyder Ali era.",
          latitude: 12.9594,
          longitude: 77.5736,
          externalUrl: "https://en.wikipedia.org/wiki/Tipu_Sultan%27s_Summer_Palace",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 7,
        },
        {
          name: "National Gallery of Modern Art, Bengaluru",
          nameLocal: "ರಾಷ್ಟ್ರೀಯ ಆಧುನಿಕ ಕಲಾ ಗ್ಯಾಲರಿ",
          category: "museum",
          description: "Manikyavelu Mansion campus showcasing modern and contemporary Indian art.",
          latitude: 12.989,
          longitude: 77.593,
          externalUrl: "https://en.wikipedia.org/wiki/National_Gallery_of_Modern_Art,_Bangalore",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 8,
        },
        {
          name: "Ulsoor Lake",
          nameLocal: "ಉಲ್ಸೂರು ಕೆರೆ",
          category: "nature",
          description: "Historic tank in east Bengaluru — walking paths, ghats, and skyline views.",
          latitude: 12.9833,
          longitude: 77.6222,
          externalUrl: "https://en.wikipedia.org/wiki/Ulsoor_Lake",
          source: "Wikipedia (CC-BY-SA)",
          sortOrder: 9,
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
    for (const p of places) {
      await upsertPlace(prisma, d.id, p);
    }
    console.log(`Upserted ${places.length} tourism places for ${slug}.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
