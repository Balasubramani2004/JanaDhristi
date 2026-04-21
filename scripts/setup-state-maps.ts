/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Processes the combined India districts GeoJSON and splits into per-state files.
 * Skips Karnataka (already has a hand-tuned map).
 *
 * Prerequisites: npx mapshaper to convert shapefile → /tmp/india-all-districts.json
 *
 * Run: npx tsx scripts/setup-state-maps.ts
 */

import fs from "fs";
import path from "path";
import { INDIA_STATES } from "../src/lib/constants/districts";

const INPUT = "/tmp/india-all-districts.json";
const OUTPUT_DIR = path.resolve("public/geo");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// State name mapping from Census data → our slug
const STATE_SLUG_MAP: Record<string, string> = {
  "andhra pradesh": "andhra-pradesh",
  "arunachal pradesh": "arunachal-pradesh",
  "arunanchal pradesh": "arunachal-pradesh",
  "assam": "assam",
  "bihar": "bihar",
  "chhattisgarh": "chhattisgarh",
  "goa": "goa",
  "gujarat": "gujarat",
  "haryana": "haryana",
  "himachal pradesh": "himachal-pradesh",
  "jharkhand": "jharkhand",
  "karnataka": "karnataka",
  "kerala": "kerala",
  "madhya pradesh": "madhya-pradesh",
  "maharashtra": "maharashtra",
  "manipur": "manipur",
  "meghalaya": "meghalaya",
  "mizoram": "mizoram",
  "nagaland": "nagaland",
  "nct of delhi": "delhi",
  "delhi": "delhi",
  "odisha": "odisha",
  "orissa": "odisha",
  "punjab": "punjab",
  "rajasthan": "rajasthan",
  "sikkim": "sikkim",
  "tamil nadu": "tamil-nadu",
  "telangana": "telangana",
  "tripura": "tripura",
  "uttar pradesh": "uttar-pradesh",
  "uttarakhand": "uttarakhand",
  "west bengal": "west-bengal",
  "andaman and nicobar islands": "andaman-nicobar",
  "andaman & nicobar islands": "andaman-nicobar",
  "andaman and nicobar": "andaman-nicobar",
  "andaman & nicobar island": "andaman-nicobar",
  "chandigarh": "chandigarh",
  "dadra and nagar haveli": "dadra-nagar-haveli-daman-diu",
  "dadra & nagar haveli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "daman and diu": "dadra-nagar-haveli-daman-diu",
  "dadra & nagar haveli": "dadra-nagar-haveli-daman-diu",
  "dadara & nagar havelli": "dadra-nagar-haveli-daman-diu",
  "daman & diu": "dadra-nagar-haveli-daman-diu",
  "jammu and kashmir": "jammu-kashmir",
  "jammu & kashmir": "jammu-kashmir",
  "ladakh": "ladakh",
  "lakshadweep": "lakshadweep",
  "puducherry": "puducherry",
  "pondicherry": "puducherry",
};

// Build district slug lookup from our constants
const districtLookup: Record<string, Record<string, string>> = {};
for (const state of INDIA_STATES) {
  districtLookup[state.slug] = {};
  for (const d of state.districts) {
    // Map district name (lowercase) → slug
    districtLookup[state.slug][d.name.toLowerCase()] = d.slug;
  }
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ ${INPUT} not found. Run this first:`);
    console.error(`   npx mapshaper /tmp/datameet-maps/Districts/Census_2011/2011_Dist.shp -simplify dp 15% -o format=geojson /tmp/india-all-districts.json`);
    process.exit(1);
  }

  console.log("Reading combined GeoJSON...");
  const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
  const features = raw.features as Array<{
    type: string;
    properties: Record<string, string | number>;
    geometry: unknown;
  }>;

  console.log(`Total features: ${features.length}\n`);

  // Group by state
  const byState: Record<string, typeof features> = {};
  const unmatchedStates = new Set<string>();

  for (const f of features) {
    const stateName = (f.properties.ST_NM ?? f.properties.st_nm ?? "").toString().trim();
    const stateSlug = STATE_SLUG_MAP[stateName.toLowerCase()];

    if (!stateSlug) {
      unmatchedStates.add(stateName);
      continue;
    }

    if (!byState[stateSlug]) byState[stateSlug] = [];

    // Add slug property to district
    const distName = (f.properties.DISTRICT ?? f.properties.district ?? "").toString().trim();
    const ourLookup = districtLookup[stateSlug] ?? {};
    const distSlug = ourLookup[distName.toLowerCase()] ?? slugify(distName);

    f.properties = {
      name: distName,
      slug: distSlug,
      stateSlug,
    };

    byState[stateSlug].push(f);
  }

  if (unmatchedStates.size > 0) {
    console.log("⚠️  Unmatched state names from Census data:");
    for (const s of unmatchedStates) console.log(`   "${s}"`);
    console.log("");
  }

  // Write per-state files
  let created = 0;
  let skipped = 0;

  for (const [stateSlug, stateFeatures] of Object.entries(byState)) {
    // Skip Karnataka — already has a hand-tuned map
    if (stateSlug === "karnataka") {
      console.log(`  ⏭  karnataka — skipped (hand-tuned map exists)`);
      skipped++;
      continue;
    }

    const outPath = path.join(OUTPUT_DIR, `${stateSlug}-districts.json`);
    const geojson = {
      type: "FeatureCollection",
      features: stateFeatures,
    };

    fs.writeFileSync(outPath, JSON.stringify(geojson));
    const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ✅ ${stateSlug} — ${stateFeatures.length} districts (${sizeKB}KB)`);
    created++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Created: ${created} state map files`);
  console.log(`Skipped: ${skipped} (Karnataka)`);
  console.log(`Output:  ${OUTPUT_DIR}/`);
  console.log(`═══════════════════════════════════════\n`);
}

main();
