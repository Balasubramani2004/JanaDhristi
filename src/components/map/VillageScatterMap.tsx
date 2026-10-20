/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 */

"use client";

import { ComposableMap, Marker } from "react-simple-maps";
import { useRouter } from "next/navigation";

const DISTRICT_PROJECTION: Record<string, { center: [number, number]; scale: number }> = {
  mandya: { center: [76.77, 12.55], scale: 16000 },
  "bengaluru-urban": { center: [77.65, 12.95], scale: 22000 },
  mysuru: { center: [76.6, 12.3], scale: 7500 },
  "new-delhi": { center: [77.21, 28.61], scale: 80000 },
  mumbai: { center: [72.87, 19.08], scale: 14000 },
  chennai: { center: [80.22, 13.05], scale: 22000 },
  kolkata: { center: [88.37, 22.55], scale: 25000 },
  lucknow: { center: [80.9, 26.85], scale: 10000 },
};
const DEFAULT_PROJECTION = { center: [76.77, 12.55] as [number, number], scale: 16000 };

export type VillagePoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

interface VillageScatterMapProps {
  locale: string;
  state: string;
  district: string;
  talukSlug: string;
  districtKey: string;
  villages: VillagePoint[];
}

export default function VillageScatterMap({
  locale,
  state,
  district,
  talukSlug,
  districtKey,
  villages,
}: VillageScatterMapProps) {
  const router = useRouter();
  const proj = DISTRICT_PROJECTION[districtKey] ?? DEFAULT_PROJECTION;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 260 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: proj.center, scale: proj.scale }}
        style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
      >
        {villages.map((v) => (
          <Marker key={v.id} coordinates={[v.longitude, v.latitude]}>
            <circle
              r={5}
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/${locale}/${state}/${district}/${talukSlug}/${v.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push(`/${locale}/${state}/${district}/${talukSlug}/${v.id}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Open ${v.name}`}
            />
          </Marker>
        ))}
      </ComposableMap>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 8,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #E8E8E4",
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: 10,
          color: "#6B6B6B",
          pointerEvents: "none",
        }}
      >
        Dots: villages with coordinates · click to open
      </div>
    </div>
  );
}
