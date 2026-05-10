/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Lock } from "lucide-react";
import { FRONTEND_STATES } from "@/lib/constants/districts";
import { enrichIndiaStatesGeoJson } from "@/lib/geo/india-state-geo";
import type { FeatureCollection } from "geojson";

function isActiveProp(v: unknown): boolean {
  return v === true || v === "true";
}

interface DrillDownMapMapboxProps {
  locale: string;
}

export default function DrillDownMapMapbox({ locale }: DrillDownMapMapboxProps) {
  const router = useRouter();
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoveredFidRef = useRef<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; active: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [82.5, 23],
      zoom: 3.25,
      minZoom: 2.6,
      maxZoom: 9,
      maxBounds: [
        [59, 3],
        [103, 39],
      ],
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    mapRef.current = map;
    let cancelled = false;

    const clearHover = () => {
      const h = hoveredFidRef.current;
      if (h && map.getSource("india-states")) {
        try {
          map.setFeatureState({ source: "india-states", id: h }, { hover: false });
        } catch {
          /* layer may be gone */
        }
      }
      hoveredFidRef.current = null;
    };

    map.on("load", () => {
      void (async () => {
        try {
          const res = await fetch("/geo/india-states.json?v=4");
          if (!res.ok || cancelled || !mapRef.current) return;
          const raw = (await res.json()) as FeatureCollection;
          if (cancelled || !mapRef.current) return;

          const enriched = enrichIndiaStatesGeoJson(raw, (slug) =>
            !!FRONTEND_STATES.find((s) => s.slug === slug)?.active
          );

          map.addSource("india-states", {
            type: "geojson",
            data: enriched,
            promoteId: "jd_fid",
          });

          map.addLayer({
            id: "india-states-fill",
            type: "fill",
            source: "india-states",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#0f766e",
                ["boolean", ["get", "jd_active"], false],
                "#0d9488",
                "#94a3b8",
              ],
              "fill-opacity": 0.52,
            },
          });

          map.addLayer({
            id: "india-states-line",
            type: "line",
            source: "india-states",
            paint: {
              "line-color": "#ffffff",
              "line-width": ["case", ["boolean", ["get", "jd_active"], false], 1.3, 0.7],
            },
          });

          map.fitBounds(
            [
              [67.8, 6.2],
              [97.8, 36.8],
            ],
            { padding: 32, duration: 0, maxZoom: 5.2 }
          );
        } catch {
          /* network / parse — leave basemap only */
        }
      })();
    });

    map.on("click", "india-states-fill", (e) => {
      const f = e.features?.[0];
      if (!f?.properties) return;
      if (!isActiveProp(f.properties.jd_active)) return;
      const slug = String(f.properties.jd_slug ?? "");
      if (!slug || slug.startsWith("__")) return;
      router.push(`/${locale}/${slug}`);
    });

    map.on("mousemove", "india-states-fill", (e) => {
      const f = e.features?.[0];
      if (!f?.properties) return;

      const fid = String(f.properties.jd_fid ?? "");
      const active = isActiveProp(f.properties.jd_active);

      if (fid && hoveredFidRef.current !== fid) {
        clearHover();
        try {
          map.setFeatureState({ source: "india-states", id: fid }, { hover: true });
          hoveredFidRef.current = fid;
        } catch {
          hoveredFidRef.current = null;
        }
      }

      map.getCanvas().style.cursor = active ? "pointer" : "not-allowed";

      setTooltip({
        name: String(f.properties.jd_label ?? ""),
        active,
        x: e.point.x,
        y: e.point.y,
      });
    });

    map.on("mouseleave", "india-states-fill", () => {
      clearHover();
      map.getCanvas().style.cursor = "";
      setTooltip(null);
    });

    return () => {
      cancelled = true;
      clearHover();
      map.remove();
      mapRef.current = null;
    };
  }, [locale, token, router]);

  if (!token) return null;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 420, borderRadius: 8, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: 420 }} />

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 12, 260),
            top: Math.max(tooltip.y - 40, 6),
            background: "var(--foreground, #0f172a)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 4px 14px rgba(15,23,42,0.2)",
          }}
        >
          {!tooltip.active && <Lock size={10} style={{ opacity: 0.7 }} />}
          {tooltip.name}
          {tooltip.active && <span style={{ color: "#99f6e4", marginLeft: 4 }}>→ Explore</span>}
          {!tooltip.active && <span style={{ color: "#94a3b8", marginLeft: 4 }}>Coming soon</span>}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 8,
          padding: "5px 9px",
          fontSize: 10,
          color: "var(--color-text-secondary, #475569)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 8, background: "#0d9488", border: "1px solid #fff", borderRadius: 2 }} />
          Active
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 8, background: "#94a3b8", border: "1px solid #fff", borderRadius: 2 }} />
          Coming soon
        </div>
      </div>
    </div>
  );
}
