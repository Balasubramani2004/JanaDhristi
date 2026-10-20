/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { readFile } from "fs/promises";
import path from "path";
import { multiPolygonCentroid, polygonCentroid } from "@/lib/geo/polygon-centroid";

type GeoFeature = {
  type?: string;
  properties?: { slug?: string; name?: string };
  geometry?: { type?: string; coordinates?: unknown };
};

type GeoCollection = { type?: string; features?: GeoFeature[] };

/** Approximate centers when state GeoJSON is missing or district polygon not found (India). */
const DISTRICT_FALLBACK: Record<string, { lat: number; lng: number }> = {
  mandya: { lat: 12.52, lng: 76.9 },
  "bengaluru-urban": { lat: 12.97, lng: 77.59 },
  mysuru: { lat: 12.3, lng: 76.65 },
};

export async function resolveDistrictLatLng(
  stateSlug: string,
  districtSlug: string
): Promise<{ lat: number; lng: number } | null> {
  const fb = DISTRICT_FALLBACK[districtSlug];
  if (fb) return fb;

  const file = path.join(process.cwd(), "public", "geo", `${stateSlug}-districts.json`);
  try {
    const raw = await readFile(file, "utf8");
    const geo = JSON.parse(raw) as GeoCollection;
    const features = geo.features ?? [];
    const feature = features.find((f) => f.properties?.slug === districtSlug);
    if (!feature?.geometry) return DISTRICT_FALLBACK[districtSlug] ?? null;

    const g = feature.geometry;
    if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
      const c = polygonCentroid(g.coordinates as number[][][]);
      return { lat: c.lat, lng: c.lng };
    }
    if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
      const c = multiPolygonCentroid(g.coordinates as number[][][][]);
      return { lat: c.lat, lng: c.lng };
    }
  } catch {
    /* missing file or parse error */
  }
  return DISTRICT_FALLBACK[districtSlug] ?? null;
}
