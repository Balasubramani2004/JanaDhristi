/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";

export type GlobeMarker = {
  lat: number;
  lng: number;
  slug: string;
  stateSlug: string;
  name: string;
  nameLocal: string;
};

interface HomeGlobeProps {
  locale: string;
}

const GLOBE_IMG = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BG_IMG = "https://unpkg.com/three-globe/example/img/night-sky.png";

export default function HomeGlobe({ locale }: HomeGlobeProps) {
  const router = useRouter();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 640, h: 400 });
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width));
      setDims({ w, h: Math.min(440, Math.max(300, Math.round(w * 0.62))) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/data/globe-markers");
        const data = (await res.json()) as { markers?: GlobeMarker[] };
        if (!cancelled) setMarkers(data.markers ?? []);
      } catch {
        if (!cancelled) setMarkers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onGlobeReady = useCallback(() => {
    const ctrl = globeRef.current?.controls();
    if (ctrl) {
      ctrl.autoRotate = true;
      ctrl.autoRotateSpeed = 0.55;
      ctrl.enableZoom = true;
    }
    globeRef.current?.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 0);
  }, []);

  const onPointClick = useCallback(
    (point: object) => {
      const p = point as GlobeMarker;
      globeRef.current?.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.45 }, 1100);
      window.setTimeout(() => {
        router.push(`/${locale}/${p.stateSlug}/${p.slug}`);
      }, 1150);
    },
    [locale, router]
  );

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: dims.h,
          background: "var(--surface-muted)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontSize: 13,
        }}
      >
        Loading globe…
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: dims.h,
          background: "var(--surface-muted)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--color-text-muted)",
          fontSize: 13,
          padding: 16,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 28 }} aria-hidden>🌍</span>
        <span>No live districts to show on the globe yet.</span>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ width: "100%", position: "relative", borderRadius: 12, overflow: "hidden" }}>
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        globeImageUrl={GLOBE_IMG}
        backgroundImageUrl={BG_IMG}
        showAtmosphere
        atmosphereColor="rgba(13,148,136,0.35)"
        atmosphereAltitude={0.12}
        backgroundColor="rgba(15,23,42,0.92)"
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#0d9488"}
        pointRadius={0.42}
        pointAltitude={0.015}
        pointLabel={(d: object) => (d as GlobeMarker).name}
        onPointClick={onPointClick}
        onGlobeReady={onGlobeReady}
        enablePointerInteraction
      />
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          right: 8,
          fontSize: 10,
          color: "rgba(226,232,240,0.85)",
          pointerEvents: "none",
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        Drag to rotate · Scroll to zoom · Click a marker to open that district
      </div>
    </div>
  );
}
