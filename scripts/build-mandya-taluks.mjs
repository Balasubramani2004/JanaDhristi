#!/usr/bin/env node
/**
 * Fetches Mandya taluk boundaries from Overpass API (OpenStreetMap)
 * Output: public/geo/mandya-taluks.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Admin level 8 = taluk/tehsil level in India OSM
const QUERY = `[out:json][timeout:60];
rel["name"="Mandya"]["admin_level"="6"]["boundary"="administrative"]->.dist;
(rel["admin_level"="8"]["boundary"="administrative"](area.dist););
out geom;`;

// Known taluk names for validation/fallback mapping (kept for reference)
// const TALUK_NAMES = [
//   "Mandya", "Maddur", "Malavalli", "Srirangapatna",
//   "Nagamangala", "Krishnarajapete", "Pandavapura"
// ];

// Name normalization
function normalizeName(name) {
  const MAP = {
    "Krishnarajapete": "K R Pete",
    "K.R. Pete": "K R Pete",
    "KR Pete": "K R Pete",
    "Sriranga Pattana": "Srirangapatna",
    "Srirangapattana": "Srirangapatna",
  };
  return MAP[name] || name;
}

// Assemble ring from ordered way geometries
function assembleRing(ways) {
  if (!ways.length) return null;
  const coords = [];
  for (const way of ways) {
    if (!way.geometry?.length) continue;
    const pts = way.geometry.map(p => [p.lon, p.lat]);
    if (!coords.length) {
      coords.push(...pts);
    } else {
      const last = coords[coords.length - 1];
      const first = pts[0];
      const lastR = pts[pts.length - 1];
      if (Math.abs(last[0] - first[0]) < 0.0001 && Math.abs(last[1] - first[1]) < 0.0001) {
        coords.push(...pts.slice(1));
      } else if (Math.abs(last[0] - lastR[0]) < 0.0001 && Math.abs(last[1] - lastR[1]) < 0.0001) {
        coords.push(...pts.slice(0, -1).reverse());
      } else {
        coords.push(...pts);
      }
    }
  }
  // Close ring
  if (coords.length > 2) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([first[0], first[1]]);
    }
  }
  return coords.length >= 4 ? coords : null;
}

async function buildMandyaTaluks() {
  console.log("Fetching Mandya taluk boundaries from Overpass API...");

  let data;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(QUERY)}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    data = await res.json();
  } catch (err) {
    console.error("Overpass API failed:", err.message);
    console.log("Falling back to hardcoded approximate coordinates...");
    buildFallback();
    return;
  }

  console.log(`Got ${data.elements?.length ?? 0} elements from Overpass`);

  const features = [];
  for (const el of (data.elements || [])) {
    if (el.type !== "relation") continue;

    const name = normalizeName(el.tags?.name || el.tags?.["name:en"] || "");
    if (!name) continue;

    const outerWays = (el.members || []).filter(m => m.role === "outer" && m.geometry?.length);
    const innerWays = (el.members || []).filter(m => m.role === "inner" && m.geometry?.length);

    const outerCoords = assembleRing(outerWays);
    if (!outerCoords) {
      console.warn(`Skipping ${name} — could not assemble outer ring`);
      continue;
    }

    const rings = [outerCoords];
    if (innerWays.length) {
      const innerCoords = assembleRing(innerWays);
      if (innerCoords) rings.push(innerCoords);
    }

    features.push({
      type: "Feature",
      properties: {
        name,
        nameLocal: el.tags?.["name:kn"] || "",
      },
      geometry: { type: "Polygon", coordinates: rings },
    });
  }

  if (features.length === 0) {
    console.warn("No valid features found, using fallback...");
    buildFallback();
    return;
  }

  // Round coordinates to 4 decimal places
  function roundCoords(coords) {
    if (Array.isArray(coords[0])) return coords.map(roundCoords);
    return [Math.round(coords[0] * 10000) / 10000, Math.round(coords[1] * 10000) / 10000];
  }
  for (const f of features) {
    f.geometry.coordinates = f.geometry.coordinates.map(roundCoords);
  }

  const geojson = { type: "FeatureCollection", features };
  const outPath = join(ROOT, "public/geo/mandya-taluks.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(geojson));
  console.log(`✓ Saved ${features.length} taluks → public/geo/mandya-taluks.json`);
  features.forEach(f => console.log(`  · ${f.properties.name}`));
}

// Fallback: approximate polygons based on known geography
function buildFallback() {
  console.log("Building fallback approximate GeoJSON for Mandya taluks...");
  // Approximate bounding boxes (lon_min, lat_min, lon_max, lat_max)
  // Based on known taluk locations within Mandya district
  const TALUKS = [
    { name: "Srirangapatna",  nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",   box: [76.5,  12.3,  76.78, 12.52] },
    { name: "Pandavapura",    nameLocal: "ಪಾಂಡವಪುರ",       box: [76.56, 12.44, 76.82, 12.62] },
    { name: "Mandya",         nameLocal: "ಮಂಡ್ಯ",           box: [76.7,  12.5,  76.96, 12.7]  },
    { name: "Maddur",         nameLocal: "ಮದ್ದೂರು",         box: [76.95, 12.45, 77.2,  12.68] },
    { name: "Malavalli",      nameLocal: "ಮಳವಳ್ಳಿ",         box: [76.88, 12.22, 77.2,  12.5]  },
    { name: "Nagamangala",    nameLocal: "ನಾಗಮಂಗಲ",        box: [76.75, 12.62, 77.02, 12.9]  },
    { name: "K R Pete",       nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",    box: [76.45, 12.65, 76.82, 13.0]  },
  ];

  function box2poly([x1, y1, x2, y2]) {
    return [[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]];
  }

  const features = TALUKS.map(t => ({
    type: "Feature",
    properties: { name: t.name, nameLocal: t.nameLocal },
    geometry: { type: "Polygon", coordinates: [box2poly(t.box)] },
  }));

  const geojson = { type: "FeatureCollection", features };
  const outPath = join(ROOT, "public/geo/mandya-taluks.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(geojson));
  console.log(`✓ Saved ${features.length} approximate taluk polygons → public/geo/mandya-taluks.json`);
}

buildMandyaTaluks().catch(err => {
  console.error("Fatal:", err);
  buildFallback();
});
