/**
 * Fetches all state GeoJSON files from udit-001/india-maps-data,
 * dissolves district polygons into state-level polygons using a simple
 * coordinate merge, and writes public/geo/india-states.json
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL =
  "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states";

// Map from udit-001 filenames → display name (matching our GEO_NAME_TO_SLUG keys)
const STATE_FILES = [
  { file: "andaman-and-nicobar-islands.geojson", name: "Andaman and Nicobar" },
  { file: "andhra-pradesh.geojson", name: "Andhra Pradesh" },
  { file: "arunachal-pradesh.geojson", name: "Arunachal Pradesh" },
  { file: "assam.geojson", name: "Assam" },
  { file: "bihar.geojson", name: "Bihar" },
  { file: "chandigarh.geojson", name: "Chandigarh" },
  { file: "chhattisgarh.geojson", name: "Chhattisgarh" },
  { file: "delhi.geojson", name: "Delhi" },
  { file: "dnh-and-dd.geojson", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { file: "goa.geojson", name: "Goa" },
  { file: "gujarat.geojson", name: "Gujarat" },
  { file: "haryana.geojson", name: "Haryana" },
  { file: "himachal-pradesh.geojson", name: "Himachal Pradesh" },
  { file: "jammu-and-kashmir.geojson", name: "Jammu and Kashmir" },
  { file: "jharkhand.geojson", name: "Jharkhand" },
  { file: "karnataka.geojson", name: "Karnataka" },
  { file: "kerala.geojson", name: "Kerala" },
  { file: "ladakh.geojson", name: "Ladakh" },
  { file: "lakshadweep.geojson", name: "Lakshadweep" },
  { file: "madhya-pradesh.geojson", name: "Madhya Pradesh" },
  { file: "maharashtra.geojson", name: "Maharashtra" },
  { file: "manipur.geojson", name: "Manipur" },
  { file: "meghalaya.geojson", name: "Meghalaya" },
  { file: "mizoram.geojson", name: "Mizoram" },
  { file: "nagaland.geojson", name: "Nagaland" },
  { file: "odisha.geojson", name: "Odisha" },
  { file: "puducherry.geojson", name: "Puducherry" },
  { file: "punjab.geojson", name: "Punjab" },
  { file: "rajasthan.geojson", name: "Rajasthan" },
  { file: "sikkim.geojson", name: "Sikkim" },
  { file: "tamil-nadu.geojson", name: "Tamil Nadu" },
  { file: "telangana.geojson", name: "Telangana" },
  { file: "tripura.geojson", name: "Tripura" },
  { file: "uttar-pradesh.geojson", name: "Uttar Pradesh" },
  { file: "uttarakhand.geojson", name: "Uttarakhand" },
  { file: "west-bengal.geojson", name: "West Bengal" },
];

/**
 * Simplify coordinates: reduce precision to 3 decimal places (~100m accuracy)
 * This reduces file size significantly while keeping boundaries accurate enough
 * for a state-level map.
 */
// 2 decimal places ≈ 1.1 km precision — good for state-level map
function simplifyCoord(coord) {
  return [Math.round(coord[0] * 100) / 100, Math.round(coord[1] * 100) / 100];
}

/**
 * Ramer-Douglas-Peucker simplification.
 * Removes points that deviate less than `epsilon` from the line between neighbours.
 */
function rdp(points, epsilon = 0.005) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = len === 0
      ? Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
      : Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / len;
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

function simplifyRing(ring) {
  // Step 1: round coordinates
  const rounded = ring.map(simplifyCoord);
  // Step 2: remove consecutive duplicates
  const deduped = rounded.filter((c, i) => {
    if (i === 0) return true;
    const prev = rounded[i - 1];
    return c[0] !== prev[0] || c[1] !== prev[1];
  });
  if (deduped.length < 4) return deduped;
  // Step 3: RDP simplification (keep ring closed)
  const open = deduped.slice(0, -1);
  const simplified = rdp(open, 0.05);
  // Re-close the ring
  if (simplified.length >= 3) {
    return [...simplified, simplified[0]];
  }
  return deduped;
}

function simplifyGeometry(geom) {
  if (geom.type === "Polygon") {
    return { type: "Polygon", coordinates: geom.coordinates.map(simplifyRing) };
  }
  if (geom.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geom.coordinates.map((poly) => poly.map(simplifyRing)),
    };
  }
  return geom;
}

/**
 * Merge all features in a FeatureCollection into a single MultiPolygon feature.
 * Since we just need the outer boundaries for rendering, we collect all rings.
 */
function mergeFeatures(features, name) {
  const allPolygons = [];

  for (const feat of features) {
    const geom = feat.geometry;
    if (!geom) continue;
    if (geom.type === "Polygon") {
      allPolygons.push(geom.coordinates);
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        allPolygons.push(poly);
      }
    }
  }

  const geometry =
    allPolygons.length === 1
      ? { type: "Polygon", coordinates: allPolygons[0] }
      : { type: "MultiPolygon", coordinates: allPolygons };

  return {
    type: "Feature",
    properties: { name },
    geometry: simplifyGeometry(geometry),
  };
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function main() {
  console.log(`Fetching ${STATE_FILES.length} state files...`);
  const features = [];

  // Fetch in batches of 6 to avoid rate limiting
  for (let i = 0; i < STATE_FILES.length; i += 6) {
    const batch = STATE_FILES.slice(i, i + 6);
    const results = await Promise.all(
      batch.map(async ({ file, name }) => {
        const url = `${BASE_URL}/${file}`;
        process.stdout.write(`  Fetching ${name}...`);
        try {
          const geojson = await fetchWithRetry(url);
          process.stdout.write(" ✓\n");
          return mergeFeatures(geojson.features ?? [], name);
        } catch (err) {
          process.stdout.write(` ✗ (${err.message})\n`);
          return null;
        }
      })
    );
    features.push(...results.filter(Boolean));
  }

  const featureCollection = {
    type: "FeatureCollection",
    features,
  };

  const outPath = join(__dirname, "../public/geo/india-states.json");
  const json = JSON.stringify(featureCollection);
  writeFileSync(outPath, json, "utf8");

  const sizeKB = (json.length / 1024).toFixed(1);
  console.log(`\n✅ Written ${outPath}`);
  console.log(`   ${features.length} states/UTs, ${sizeKB} KB`);

  // Print any states that use different name keys
  const names = features.map((f) => f.properties.name);
  console.log("\nState names in output:");
  names.forEach((n) => console.log(`  "${n}"`));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
