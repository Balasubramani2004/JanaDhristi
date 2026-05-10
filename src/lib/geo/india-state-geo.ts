/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Canonical `properties.name` values from `public/geo/india-states.json` (DataMeet / Census 2011 derived).
 * Must stay in sync with that file — run a one-off extract of feature names if the GeoJSON is replaced.
 */
export const INDIA_GEOJSON_NAME_TO_SLUG: Record<string, string> = {
  "Andaman and Nicobar": "andaman-nicobar",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  Assam: "assam",
  Bihar: "bihar",
  Chandigarh: "chandigarh",
  Chhattisgarh: "chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu": "dadra-nagar-haveli",
  Delhi: "delhi",
  Goa: "goa",
  Gujarat: "gujarat",
  Haryana: "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu and Kashmir": "jammu-kashmir",
  Jharkhand: "jharkhand",
  Karnataka: "karnataka",
  Kerala: "kerala",
  Ladakh: "ladakh",
  Lakshadweep: "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  Maharashtra: "maharashtra",
  Manipur: "manipur",
  Meghalaya: "meghalaya",
  Mizoram: "mizoram",
  Nagaland: "nagaland",
  Odisha: "odisha",
  Puducherry: "puducherry",
  Punjab: "punjab",
  Rajasthan: "rajasthan",
  Sikkim: "sikkim",
  "Tamil Nadu": "tamil-nadu",
  Telangana: "telangana",
  Tripura: "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  Uttarakhand: "uttarakhand",
  "West Bengal": "west-bengal",
};

/** Alternate labels from older GeoJSON builds or other sources → same slugs */
const LEGACY_GEO_NAME_TO_SLUG: Record<string, string> = {
  "Andaman & Nicobar Island": "andaman-nicobar",
  "Dadra and Nagar Haveli": "dadra-nagar-haveli",
  "Daman and Diu": "dadra-nagar-haveli",
  "NCT of Delhi": "delhi",
  "Jammu & Kashmir": "jammu-kashmir",
};

export function geoNameToSlug(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  if (INDIA_GEOJSON_NAME_TO_SLUG[raw]) return INDIA_GEOJSON_NAME_TO_SLUG[raw];
  if (LEGACY_GEO_NAME_TO_SLUG[raw]) return LEGACY_GEO_NAME_TO_SLUG[raw];
  return undefined;
}

export type EnrichedIndiaStateProps = {
  /** Stable unique id for Mapbox `promoteId` (real slug or `__unmapped_${idx}`). */
  jd_fid: string;
  /** Canonical route slug when known; empty if unmapped. */
  jd_slug: string;
  jd_active: boolean;
  jd_label: string;
  [key: string]: unknown;
};

export function enrichIndiaStatesGeoJson(
  fc: FeatureCollection,
  isStateActive: (slug: string) => boolean
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f, idx): Feature<Geometry, EnrichedIndiaStateProps> => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const label = String(props.name ?? props.NAME_1 ?? "");
      const routeSlug = geoNameToSlug(label) ?? "";
      const fid = routeSlug || `__unmapped_${idx}`;
      const active = routeSlug ? isStateActive(routeSlug) : false;
      return {
        ...f,
        properties: {
          ...props,
          jd_fid: fid,
          jd_slug: routeSlug,
          jd_active: active,
          jd_label: label || routeSlug,
        },
      };
    }),
  };
}
