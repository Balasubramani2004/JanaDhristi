/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import DrillDownMapMapbox from "@/components/map/DrillDownMapMapbox";
import DrillDownMapSvg from "@/components/map/DrillDownMapSvg";

interface DrillDownMapProps {
  locale: string;
}

/** Mapbox basemap when `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set; otherwise SVG (react-simple-maps). */
export default function DrillDownMap({ locale }: DrillDownMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (token) {
    return <DrillDownMapMapbox locale={locale} />;
  }
  return <DrillDownMapSvg locale={locale} />;
}
