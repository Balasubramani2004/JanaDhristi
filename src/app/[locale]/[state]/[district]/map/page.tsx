/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
*/

"use client";
import { use, useState, useEffect, type CSSProperties } from "react";
import { Map, ChevronRight, Compass, Building2, Landmark } from "lucide-react";
import Link from "next/link";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell } from "@/components/district/ui";
import TalukMap from "@/components/map/TalukMap";
import { getStateConfig } from "@/lib/constants/state-config";

type TalukCard = {
  slug: string;
  name: string;
  nameLocal?: string | null;
  population?: number | null;
  area?: number | null;
  villageCount: number;
};

interface GeoJSONCollection {
  type?: string;
  features?: Array<{ type?: string; properties?: Record<string, unknown>; geometry?: unknown }>;
}

type Coverage =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "partial"; features: number }
  | { status: "full"; geoUrl: string };

function talukGeoUrls(district: string): string[] {
  return [`/geo/${district}-taluks.json`, `/geo/karnataka-${district}-taluks.json`];
}

async function fetchGeoJson(url: string): Promise<GeoJSONCollection | null> {
  const r = await fetch(url);
  if (!r.ok) return null;
  const ct = r.headers.get("content-type") ?? "";
  if (!/json/i.test(ct)) return null;
  try {
    return (await r.json()) as GeoJSONCollection;
  } catch {
    return null;
  }
}

function DistrictMapArea({
  locale,
  state,
  district,
  talukList,
  urbanLabel,
}: {
  locale: string;
  state: string;
  district: string;
  talukList: TalukCard[];
  urbanLabel: boolean;
}) {
  const [coverage, setCoverage] = useState<Coverage>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const need = talukList.length;
      let bestPartial = 0;

      for (const url of talukGeoUrls(district)) {
        if (cancelled) return;
        const geo = await fetchGeoJson(url).catch(() => null);
        if (cancelled) return;
        if (!geo || !Array.isArray(geo.features)) continue;
        const count = geo.features.length;
        if (count === 0) continue;
        if (need === 0) {
          setCoverage({ status: "full", geoUrl: url });
          return;
        }
        if (count >= need) {
          setCoverage({ status: "full", geoUrl: url });
          return;
        }
        bestPartial = Math.max(bestPartial, count);
      }

      if (cancelled) return;
      if (bestPartial > 0 && need > 0) {
        setCoverage({ status: "partial", features: bestPartial });
      } else {
        setCoverage({ status: "missing" });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [district, talukList.length]);

  if (coverage.status === "loading") return <LoadingShell rows={2} />;

  // Render the interactive D3 map only when the GeoJSON covers every DB taluk.
  if (coverage.status === "full") {
    const mapTaluks = talukList.map((t) => ({
      slug: t.slug,
      name: t.name,
      population: t.population ?? undefined,
      villageCount: t.villageCount,
    }));
    return (
      <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 16, marginBottom: 24 }}>
        <TalukMap
          locale={locale}
          state={state}
          district={district}
          geographyUrl={coverage.geoUrl}
          taluks={mapTaluks}
        />
      </div>
    );
  }

  // Fallback: card grid covering every DB taluk.
  const headline =
    coverage.status === "partial"
      ? `Boundary data covers ${coverage.features} of ${talukList.length} ${urbanLabel ? "zones" : "taluks"} — showing the full list below.`
      : "Boundary data is being prepared — use the list below. When GeoJSON covers every sub-district, an interactive map appears here.";

  return (
    <>
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E8E8E4",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "#6B6B6B",
        }}
      >
        <Map size={14} style={{ color: "#9B9B9B", flexShrink: 0 }} />
        <span>{headline}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {talukList.map((t) => (
          <Link
            key={t.slug}
            href={`/${locale}/${state}/${district}/${t.slug}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              padding: "12px 14px",
              background: "#FFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              textDecoration: "none",
              transition: "border-color 150ms, box-shadow 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#2563EB";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#E8E8E4";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{t.name}</div>
              {t.nameLocal && (
                <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 2 }}>
                  {t.nameLocal}
                </div>
              )}
              {(t.population != null || t.area != null) && (
                <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {t.population != null && (
                    <span style={{ fontFamily: "var(--font-mono)" }}>{t.population.toLocaleString("en-IN")} pop</span>
                  )}
                  {t.area != null && (
                    <span style={{ fontFamily: "var(--font-mono)" }}>· {t.area} km²</span>
                  )}
                </div>
              )}
            </div>
            <ChevronRight size={15} style={{ color: "#C0C0C0", flexShrink: 0, marginTop: 2 }} />
          </Link>
        ))}
      </div>
    </>
  );
}

export default function MapPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const subUnitPlural = stateConfig?.subDistrictUnitPlural ?? "Taluks";
  const hideVillages = stateConfig?.showVillages === false;
  const { data: taluksData, isLoading: taluksLoading } = useTaluks(district, state);
  const { data: overviewData, isLoading: overviewLoading } = useOverview(district, state);

  const taluks = taluksData?.data ?? [];
  const overview = overviewData?.data;
  const isLoading = taluksLoading || overviewLoading;

  const talukList: TalukCard[] = taluks.map((t) => ({
    slug: t.slug,
    name: t.name,
    nameLocal: t.nameLocal ?? null,
    population: t.population ?? null,
    area: t.area ?? null,
    villageCount: t._count.villages || t.villageCount || 0,
  }));

  const mapSectionLabel = hideVillages ? "Urban Zones" : `${subUnit} Map`;
  const listSectionLabel = hideVillages
    ? `Zones in ${overview?.name ?? "this district"}`
    : `${subUnitPlural}${hideVillages ? "" : " & Villages"}`;

  const exploreLinkStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    background: "#FFF",
    border: "1px solid #E8E8E4",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    color: "#1D4ED8",
    textDecoration: "none",
  };

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Map}
        title="District Map"
        description={
          hideVillages
            ? "Browse the urban zones of this district — click any zone to see its data"
            : `Interactive ${subUnit.toLowerCase()} map — click to explore each ${subUnit.toLowerCase()}`
        }
        backHref={base}
      />
      {isLoading && <LoadingShell rows={4} />}

      {!isLoading && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9B9B9B", marginRight: 4 }}>
              Explore
            </span>
            <Link href={base} style={exploreLinkStyle}>
              <Compass size={14} />
              District overview
            </Link>
            <Link href={`${base}/map#district-taluk-explore`} style={exploreLinkStyle}>
              <Map size={14} />
              {hideVillages ? "All zones" : `All ${subUnitPlural.toLowerCase()}`}
            </Link>
            {!hideVillages && (
              <Link href={`${base}/gram-panchayat`} style={exploreLinkStyle}>
                <Building2 size={14} />
                Gram panchayats
              </Link>
            )}
            <Link href={`${base}/tourism`} style={exploreLinkStyle}>
              <Landmark size={14} />
              Tourism
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label={hideVillages ? "Zones" : subUnitPlural} value={taluks.length} icon={Map} />
            {!hideVillages && <StatCard label="Villages" value={taluks.reduce((s, t) => s + (t._count.villages || t.villageCount || 0), 0).toLocaleString("en-IN")} />}
            {overview?.area && <StatCard label="Area" value={`${overview.area.toLocaleString("en-IN")} km²`} />}
            {overview?.population && <StatCard label="Population" value={`${(overview.population / 1000000).toFixed(2)}M`} />}
          </div>

          {/* Map or card-grid fallback */}
          <SectionLabel>
            <span id="district-taluk-explore">{mapSectionLabel}</span>
          </SectionLabel>
          <DistrictMapArea
            locale={locale}
            state={state}
            district={district}
            talukList={talukList}
            urbanLabel={hideVillages}
          />

          {/* Optional: duplicated list with village counts for rural districts */}
          {!hideVillages && (
            <>
              <SectionLabel>{listSectionLabel}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {taluks.map((t) => (
                  <div key={t.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
                    <Link
                      href={`/${locale}/${state}/${district}/${t.slug}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", textDecoration: "none",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{t.name}</div>
                        {t.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{t.nameLocal}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#6B6B6B" }}>{t._count.villages || t.villageCount || 0} villages</span>
                        <ChevronRight size={16} style={{ color: "#C0C0C0" }} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
