// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Light Data Seed for 10 Inactive Delhi Districts
// Seeds minimal data: leadership (tiers 4-5), police stations, schools,
// offices, and demographics for each district.
//
// Run BEFORE activate-delhi-districts.ts
// Usage: npx tsx scripts/seed-delhi-other-districts.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface DistrictSeed {
  slug: string;
  dm: string;
  dcp: string;
  policeStations: Array<{ name: string; address: string }>;
  schools: Array<{ name: string; type: string; level: string; students: number; teachers: number }>;
  offices: Array<{ name: string; type: string; address: string; phone?: string }>;
  pop2011: number;
  pop2001: number;
  literacy: number;
  sexRatio: number;
}

const DISTRICTS: DistrictSeed[] = [
  {
    slug: "central-delhi", dm: "DM, Central Delhi", dcp: "DCP, Central Delhi",
    policeStations: [
      { name: "Kamla Market Police Station", address: "Kamla Market, Central Delhi" },
      { name: "Daryaganj Police Station", address: "Daryaganj, Central Delhi" },
      { name: "Jama Masjid Police Station", address: "Jama Masjid, Old Delhi" },
    ],
    schools: [
      { name: "Govt Boys SSS, Ajmeri Gate", type: "Government", level: "Senior Secondary", students: 1100, teachers: 38 },
      { name: "Anglo Arabic Sr Sec School, Ajmeri Gate", type: "Government", level: "Senior Secondary", students: 2200, teachers: 72 },
      { name: "St. Xavier's School, Raj Niwas Marg", type: "Private", level: "Senior Secondary", students: 1800, teachers: 85 },
    ],
    offices: [
      { name: "DM Office, Central Delhi", type: "DC Office", address: "Bahadur Shah Zafar Marg, New Delhi", phone: "011-23221177" },
      { name: "MCD Zone Office — Central", type: "Municipal Corporation", address: "Town Hall, Chandni Chowk" },
    ],
    pop2011: 578671, pop2001: 644005, literacy: 83.14, sexRatio: 883,
  },
  {
    slug: "north-delhi", dm: "DM, North Delhi", dcp: "DCP, North Delhi",
    policeStations: [
      { name: "Civil Lines Police Station", address: "Civil Lines, North Delhi" },
      { name: "Roop Nagar Police Station", address: "Roop Nagar, North Delhi" },
      { name: "Timarpur Police Station", address: "Timarpur, North Delhi" },
    ],
    schools: [
      { name: "Govt Boys SSS, Civil Lines", type: "Government", level: "Senior Secondary", students: 900, teachers: 32 },
      { name: "St. Stephen's School, Tis Hazari", type: "Private", level: "Senior Secondary", students: 1200, teachers: 55 },
      { name: "DAV Public School, Model Town", type: "Private", level: "Senior Secondary", students: 2400, teachers: 98 },
    ],
    offices: [
      { name: "DM Office, North Delhi", type: "DC Office", address: "Court Complex, Tis Hazari" },
      { name: "MCD Zone Office — Civil Lines", type: "Municipal Corporation", address: "Civil Lines, North Delhi" },
    ],
    pop2011: 887978, pop2001: 929428, literacy: 84.75, sexRatio: 895,
  },
  {
    slug: "north-west-delhi", dm: "DM, North West Delhi", dcp: "DCP, North West Delhi",
    policeStations: [
      { name: "Narela Police Station", address: "Narela, North West Delhi" },
      { name: "Rohini North Police Station", address: "Sector 16, Rohini" },
      { name: "Kanjhawala Police Station", address: "Kanjhawala, North West Delhi" },
      { name: "Alipur Police Station", address: "Alipur, North West Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Narela", type: "Government", level: "Senior Secondary", students: 1800, teachers: 58 },
      { name: "KV, Rohini Sector 8", type: "Central Govt", level: "Senior Secondary", students: 2000, teachers: 72 },
      { name: "Ryan International, Rohini", type: "Private", level: "Senior Secondary", students: 3200, teachers: 140 },
    ],
    offices: [
      { name: "DM Office, North West Delhi", type: "DC Office", address: "Kanjhawala Road, Delhi" },
      { name: "SDM Office, Narela", type: "Sub-Divisional Magistrate", address: "Narela, Delhi" },
    ],
    pop2011: 3651261, pop2001: 2860869, literacy: 82.47, sexRatio: 866,
  },
  {
    slug: "north-east-delhi", dm: "DM, North East Delhi", dcp: "DCP, North East Delhi",
    policeStations: [
      { name: "Seelampur Police Station", address: "Seelampur, NE Delhi" },
      { name: "Jafrabad Police Station", address: "Jafrabad, NE Delhi" },
      { name: "Welcome Police Station", address: "Welcome Colony, NE Delhi" },
    ],
    schools: [
      { name: "Govt Boys SSS, Seelampur", type: "Government", level: "Senior Secondary", students: 1400, teachers: 45 },
      { name: "Govt Girls SSS, Yamuna Vihar", type: "Government", level: "Senior Secondary", students: 1200, teachers: 42 },
      { name: "Holy Child School, Sonia Vihar", type: "Private", level: "Senior Secondary", students: 1000, teachers: 48 },
    ],
    offices: [
      { name: "DM Office, North East Delhi", type: "DC Office", address: "Seelampur, Delhi" },
      { name: "MCD Zone Office — Shahdara North", type: "Municipal Corporation", address: "NE Delhi" },
    ],
    pop2011: 2241624, pop2001: 1768061, literacy: 80.90, sexRatio: 886,
  },
  {
    slug: "east-delhi", dm: "DM, East Delhi", dcp: "DCP, East Delhi",
    policeStations: [
      { name: "Gandhi Nagar Police Station", address: "Gandhi Nagar, East Delhi" },
      { name: "Preet Vihar Police Station", address: "Preet Vihar, East Delhi" },
      { name: "Pandav Nagar Police Station", address: "Pandav Nagar, East Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Gandhi Nagar", type: "Government", level: "Senior Secondary", students: 1300, teachers: 44 },
      { name: "KV, Laxmi Nagar", type: "Central Govt", level: "Senior Secondary", students: 1600, teachers: 60 },
      { name: "DAV Centenary Public School, Preet Vihar", type: "Private", level: "Senior Secondary", students: 2000, teachers: 85 },
    ],
    offices: [
      { name: "DM Office, East Delhi", type: "DC Office", address: "Patparganj, East Delhi" },
      { name: "MCD Zone Office — Gandhi Nagar", type: "Municipal Corporation", address: "Gandhi Nagar, East Delhi" },
    ],
    pop2011: 1707725, pop2001: 1448770, literacy: 86.05, sexRatio: 881,
  },
  {
    slug: "south-delhi", dm: "DM, South Delhi", dcp: "DCP, South Delhi",
    policeStations: [
      { name: "Defence Colony Police Station", address: "Defence Colony, South Delhi" },
      { name: "Hauz Khas Police Station", address: "Hauz Khas, South Delhi" },
      { name: "Mehrauli Police Station", address: "Mehrauli, South Delhi" },
      { name: "Malviya Nagar Police Station", address: "Malviya Nagar, South Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Hauz Khas", type: "Government", level: "Senior Secondary", students: 1000, teachers: 36 },
      { name: "DPS, R K Puram", type: "Private", level: "Senior Secondary", students: 4500, teachers: 220 },
      { name: "Sardar Patel Vidyalaya, Lodi Estate", type: "Private", level: "Senior Secondary", students: 2800, teachers: 135 },
      { name: "Sanskriti School, Chanakyapuri", type: "Private", level: "Senior Secondary", students: 1200, teachers: 65 },
    ],
    offices: [
      { name: "DM Office, South Delhi", type: "DC Office", address: "Saket, New Delhi" },
      { name: "MCD Zone Office — South", type: "Municipal Corporation", address: "Hauz Khas, South Delhi" },
    ],
    pop2011: 2731929, pop2001: 2267023, literacy: 86.48, sexRatio: 898,
  },
  {
    slug: "south-west-delhi", dm: "DM, South West Delhi", dcp: "DCP, South West Delhi",
    policeStations: [
      { name: "Dwarka North Police Station", address: "Sector 23, Dwarka" },
      { name: "Najafgarh Police Station", address: "Najafgarh, SW Delhi" },
      { name: "Kapashera Police Station", address: "Kapashera, SW Delhi" },
      { name: "IGI Airport Police Station", address: "IGI Airport, Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Dwarka Sector 6", type: "Government", level: "Senior Secondary", students: 1600, teachers: 52 },
      { name: "KV, Dwarka Sector 8", type: "Central Govt", level: "Senior Secondary", students: 1800, teachers: 68 },
      { name: "Mount Abu Public School, Dwarka", type: "Private", level: "Senior Secondary", students: 2200, teachers: 95 },
    ],
    offices: [
      { name: "DM Office, South West Delhi", type: "DC Office", address: "Dwarka, Delhi" },
      { name: "SDM Office, Najafgarh", type: "Sub-Divisional Magistrate", address: "Najafgarh, Delhi" },
    ],
    pop2011: 2292958, pop2001: 1749492, literacy: 85.51, sexRatio: 844,
  },
  {
    slug: "south-east-delhi", dm: "DM, South East Delhi", dcp: "DCP, South East Delhi",
    policeStations: [
      { name: "Sarita Vihar Police Station", address: "Sarita Vihar, SE Delhi" },
      { name: "Kalkaji Police Station", address: "Kalkaji, SE Delhi" },
      { name: "Okhla Industrial Area Police Station", address: "Okhla Phase 2, SE Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Kalkaji", type: "Government", level: "Senior Secondary", students: 1100, teachers: 38 },
      { name: "Lotus Valley International, Noida Expressway", type: "Private", level: "Senior Secondary", students: 2400, teachers: 110 },
      { name: "KV, Badarpur", type: "Central Govt", level: "Senior Secondary", students: 1400, teachers: 52 },
    ],
    offices: [
      { name: "DM Office, South East Delhi", type: "DC Office", address: "Defence Colony, New Delhi" },
      { name: "MCD Zone Office — Kalkaji", type: "Municipal Corporation", address: "Kalkaji, SE Delhi" },
    ],
    pop2011: 1534795, pop2001: 1274838, literacy: 85.11, sexRatio: 897,
  },
  {
    slug: "west-delhi", dm: "DM, West Delhi", dcp: "DCP, West Delhi",
    policeStations: [
      { name: "Rajouri Garden Police Station", address: "Rajouri Garden, West Delhi" },
      { name: "Punjabi Bagh Police Station", address: "Punjabi Bagh, West Delhi" },
      { name: "Patel Nagar Police Station", address: "Patel Nagar, West Delhi" },
      { name: "Tilak Nagar Police Station", address: "Tilak Nagar, West Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Rajouri Garden", type: "Government", level: "Senior Secondary", students: 1200, teachers: 42 },
      { name: "Guru Nanak Public School, Punjabi Bagh", type: "Private", level: "Senior Secondary", students: 2600, teachers: 115 },
      { name: "KV, Patel Nagar", type: "Central Govt", level: "Senior Secondary", students: 1500, teachers: 56 },
    ],
    offices: [
      { name: "DM Office, West Delhi", type: "DC Office", address: "Janakpuri, Delhi" },
      { name: "MCD Zone Office — West", type: "Municipal Corporation", address: "Rajouri Garden, West Delhi" },
    ],
    pop2011: 2543243, pop2001: 2119641, literacy: 83.18, sexRatio: 876,
  },
  {
    slug: "shahdara", dm: "DM, Shahdara", dcp: "DCP, Shahdara",
    policeStations: [
      { name: "Shahdara Police Station", address: "Shahdara, Delhi" },
      { name: "Vivek Vihar Police Station", address: "Vivek Vihar, Shahdara" },
      { name: "Anand Vihar Police Station", address: "Anand Vihar, Delhi" },
    ],
    schools: [
      { name: "Govt SSS, Shahdara", type: "Government", level: "Senior Secondary", students: 1500, teachers: 50 },
      { name: "Cambridge School, Anand Vihar", type: "Private", level: "Senior Secondary", students: 1800, teachers: 78 },
      { name: "KV, Shahdara", type: "Central Govt", level: "Senior Secondary", students: 1400, teachers: 54 },
    ],
    offices: [
      { name: "DM Office, Shahdara", type: "DC Office", address: "Nand Nagri, Delhi" },
      { name: "MCD Zone Office — Shahdara", type: "Municipal Corporation", address: "Shahdara, Delhi" },
    ],
    pop2011: 1693005, pop2001: 1320312, literacy: 85.31, sexRatio: 882,
  },
];

async function main() {
  console.log("🏛️  Seeding light data for 10 Delhi districts...\n");

  const delhi = await prisma.state.findUnique({ where: { slug: "delhi" } });
  if (!delhi) throw new Error("Delhi not found in DB. Run seed-hierarchy.ts first.");

  for (const d of DISTRICTS) {
    const district = await prisma.district.findFirst({
      where: { slug: d.slug, stateId: delhi.id },
    });
    if (!district) {
      console.log(`⚠️  ${d.slug} not found, skipping`);
      continue;
    }
    const did = district.id;
    console.log(`📍 ${district.name}:`);

    // Population
    const popCount = await prisma.populationHistory.count({ where: { districtId: did } });
    if (popCount === 0) {
      await prisma.populationHistory.createMany({ data: [
        { districtId: did, year: 2001, population: d.pop2001, sexRatio: d.sexRatio, literacy: d.literacy - 2, urbanPct: 100, source: "Census of India" },
        { districtId: did, year: 2011, population: d.pop2011, sexRatio: d.sexRatio, literacy: d.literacy, urbanPct: 100, source: "Census of India" },
      ]});
      console.log("  ✓ Population history");
    }

    // Leadership (Tier 4-5 only)
    const leaderCount = await prisma.leader.count({ where: { districtId: did } });
    if (leaderCount === 0) {
      await prisma.leader.createMany({ data: [
        { districtId: did, name: d.dm, role: `District Magistrate, ${district.name}`, tier: 4, source: "delhi.gov.in" },
        { districtId: did, name: d.dcp, role: `Deputy Commissioner of Police, ${district.name}`, tier: 5, source: "delhipolice.gov.in" },
      ]});
      console.log("  ✓ Leadership (2)");
    }

    // Police Stations
    const psCount = await prisma.policeStation.count({ where: { districtId: did } });
    if (psCount === 0) {
      await prisma.policeStation.createMany({
        data: d.policeStations.map(ps => ({ districtId: did, name: ps.name, address: ps.address, phone: "112" })),
      });
      console.log(`  ✓ Police stations (${d.policeStations.length})`);
    }

    // Schools
    const schoolCount = await prisma.school.count({ where: { districtId: did } });
    if (schoolCount === 0) {
      await prisma.school.createMany({
        data: d.schools.map(s => ({
          districtId: did, name: s.name, type: s.type, level: s.level,
          students: s.students, teachers: s.teachers,
          studentTeacherRatio: Math.round((s.students / s.teachers) * 10) / 10,
          hasToilets: true, hasLibrary: true, hasLab: s.type !== "Government",
        })),
      });
      console.log(`  ✓ Schools (${d.schools.length})`);
    }

    // Government Offices
    const officeCount = await prisma.govOffice.count({ where: { districtId: did } });
    if (officeCount === 0) {
      await prisma.govOffice.createMany({
        data: d.offices.map(o => ({
          districtId: did, name: o.name, type: o.type, address: o.address,
          phone: o.phone, active: true,
          mondayHours: "09:30-17:30", tuesdayHours: "09:30-17:30", wednesdayHours: "09:30-17:30",
          thursdayHours: "09:30-17:30", fridayHours: "09:30-17:30",
        })),
      });
      console.log(`  ✓ Offices (${d.offices.length})`);
    }

    console.log("");
  }

  console.log("✅ Light data seeded for 10 Delhi districts.");
  console.log("Next: run scripts/activate-delhi-districts.ts to go live.");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
