/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 */

"use client";

import { use } from "react";
import Link from "next/link";
import { Landmark, ExternalLink, MapPin } from "lucide-react";
import { useTourism } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock } from "@/components/district/ui";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

const CATEGORY_LABEL: Record<string, string> = {
  heritage: "Heritage",
  nature: "Nature",
  pilgrimage: "Pilgrimage",
  museum: "Museum",
  wildlife: "Wildlife",
  other: "Highlight",
};

export default function TourismPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useTourism(district, state);
  const places = data?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Landmark}
        title="Tourism & Heritage"
        description="Notable places visitors seek in this district — curated from public sources"
        backHref={base}
      />
      {(() => {
        const _src = getModuleSources("tourism", state);
        return (
          <DataSourceBanner
            moduleName="tourism"
            sources={_src.sources}
            updateFrequency={_src.frequency}
            isLive={_src.isLive}
          />
        );
      })()}
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && places.length === 0 && (
        <NoDataCard module="tourism" district={district} state={state} />
      )}
      {!isLoading && !error && places.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {places.map((p) => {
            const cat = CATEGORY_LABEL[p.category.toLowerCase()] ?? p.category;
            return (
              <div
                key={p.id}
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 14,
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      {cat}
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{p.name}</h2>
                    {p.nameLocal && (
                      <div style={{ fontSize: 14, color: "#6B6B6B", fontFamily: "var(--font-regional)", marginTop: 4 }}>{p.nameLocal}</div>
                    )}
                  </div>
                  {p.externalUrl && (
                    <Link
                      href={p.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1D4ED8",
                        textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      More info <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
                {p.description && (
                  <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.65, margin: "12px 0 0" }}>{p.description}</p>
                )}
                {(p.latitude != null && p.longitude != null) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: "#6B6B6B" }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}&zoom=14`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 8, color: "#2563EB", fontWeight: 500 }}
                    >
                      Map
                    </a>
                  </div>
                )}
                {p.source && (
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 10 }}>Source: {p.source}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
