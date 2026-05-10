/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, Component, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, ArrowRight, MapPin } from "lucide-react";
import { FRONTEND_STATES } from "@/lib/constants/districts";
import { useTranslations } from "next-intl";

// Districts activated within the last 30 days get a "NEW" badge
const DISTRICT_ACTIVATED_AT: Record<string, string> = {
  hyderabad: "2026-04-10",
  // Add new districts here as they go live
};
function isNewDistrict(slug: string): boolean {
  const activatedAt = DISTRICT_ACTIVATED_AT[slug];
  if (!activatedAt) return false;
  return Date.now() - new Date(activatedAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}
import dynamic from "next/dynamic";
import HomepageStats from "@/components/home/HomepageStats";
import LiveDataPreview from "@/components/home/LiveDataPreview";
import HowItWorks from "@/components/home/HowItWorks";
import DistrictRequestSection from "@/components/home/DistrictRequestSection";
import GlobalTrendsSection from "@/components/home/GlobalTrendsSection";

const HomeGlobe = dynamic(() => import("@/components/map/HomeGlobe"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        minHeight: 300,
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
  ),
});

// Error boundary so a map crash never brings down the whole page
class MapErrorBoundary extends Component<{ children: ReactNode; unavailableText: string; selectDistrictText: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ width: "100%", height: "100%", minHeight: 300, background: "var(--surface-muted)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--color-text-muted)", fontSize: 13 }}>
          <span style={{ fontSize: 28 }}>🗺️</span>
          <span>{this.props.unavailableText}</span>
          <span style={{ fontSize: 11 }}>{this.props.selectDistrictText}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface DistrictPreview {
  slug: string;
  name: string;
  nameLocal: string;
  tagline: string | null;
  weather: { temp: number | null; conditions: string | null } | null;
  dam: { name: string; storagePct: number } | null;
  crop: { commodity: string; price: number } | null;
  healthGrade: string | null;
  healthScore: number | null;
}

interface PreviewResponse {
  districtPreviews: DistrictPreview[];
}

interface HomeDrilldownProps {
  locale: string;
  tickerShown?: boolean;
}

function gradeColor(grade: string): { bg: string; text: string } {
  if (grade === "A+" || grade === "A") return { bg: "#DCFCE7", text: "#15803D" };
  if (grade === "B+" || grade === "B") return { bg: "var(--color-selected-bg)", text: "var(--color-brand-strong)" };
  if (grade === "C+" || grade === "C") return { bg: "#FEF3C7", text: "#92400E" };
  if (grade === "D") return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "var(--surface-muted)", text: "var(--color-text-muted)" };
}

export default function HomeDrilldown({ locale }: HomeDrilldownProps) {
  const t = useTranslations("home");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: previewData } = useQuery<PreviewResponse>({
    queryKey: ["homepage-preview"],
    queryFn: () => fetch("/api/data/homepage-preview").then((r) => r.json()),
    staleTime: 300_000,
  });

  const allDistricts = FRONTEND_STATES.flatMap((s) =>
    s.districts.map((d) => ({ state: s, district: d }))
  );
  const filtered = searchQuery.length >= 2
    ? allDistricts
        .filter(({ district }) =>
          district.active &&
          (district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            district.nameLocal.includes(searchQuery))
        )
        .slice(0, 5)
    : [];

  const activeDistricts = FRONTEND_STATES.flatMap((s) =>
    s.districts.filter((d) => d.active).map((d) => ({ ...d, _stateSlug: s.slug }))
  );

  const districtPreviews = previewData?.districtPreviews ?? [];

  return (
    <main style={{ background: "var(--background)", paddingBottom: 40 }}>
      {/* New template hero */}
      <section style={{ padding: "18px 16px 8px" }}>
        <div className="template-hero" style={{ borderRadius: 18, padding: "18px 18px 16px" }}>
          <div className="md:grid md:grid-cols-[1.2fr_0.8fr]" style={{ gap: 16, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.9 }}>
                {t("explorerEyebrow")}
              </div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", lineHeight: 1.15, marginTop: 6 }}>
                {t("explorerTitle")}
              </div>
              <div style={{ fontSize: 13, opacity: 0.92, marginTop: 8, lineHeight: 1.55, maxWidth: 720 }}>
                {t("explorerSubtitle")}
              </div>
              <div style={{ marginTop: 14, maxWidth: 520 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <Search size={16} style={{ color: "rgba(255,255,255,0.9)", flexShrink: 0 }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchDistrictPlaceholder")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: "#fff",
                      background: "transparent",
                    }}
                  />
                </div>
                {filtered.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "var(--surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 14,
                      boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
                      overflow: "hidden",
                    }}
                  >
                    {filtered.map(({ state, district }) => (
                      <Link
                        key={district.slug}
                        href={`/${locale}/${state.slug}/${district.slug}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 14px",
                          textDecoration: "none",
                          color: "var(--foreground)",
                          borderBottom: "1px solid rgba(220, 228, 245, 0.7)",
                        }}
                      >
                        <MapPin size={14} style={{ color: "var(--color-accent-blue)", marginRight: 10, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{district.name}</span>
                        {district.nameLocal && (
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 6, fontFamily: "var(--font-regional)" }}>
                            {district.nameLocal}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginLeft: "auto" }}>{state.name}</span>
                        <ArrowRight size={14} style={{ color: "var(--color-accent-blue)", marginLeft: 8 }} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14 }} className="md:mt-0">
              <div style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>
                    Quick start
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>Tip: Click a state on the map</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {activeDistricts.slice(0, 6).map((d) => (
                    <Link
                      key={d.slug}
                      href={`/${locale}/${d._stateSlug}/${d.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 10px",
                        borderRadius: 12,
                        textDecoration: "none",
                        color: "#fff",
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>📍</span>
                      <span>{d.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats (kept, but now sits under the new hero) */}
      <HomepageStats />

      {/* Globe + District cards: 2-col on desktop, stacked on mobile */}
      <div>
        <div style={{ padding: "10px 16px 8px" }}>
          <span
            style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "var(--color-text-muted)",
            }}
          >
            {t("globeExplorerHint")}
          </span>
        </div>

        <div className="md:grid md:grid-cols-[3fr_2fr]" style={{ gap: 20, padding: "0 16px" }}>
          {/* Globe column */}
          <div>
            <div className="touch-pan-y md:touch-auto">
              <MapErrorBoundary
                unavailableText={t("mapUnavailable")}
                selectDistrictText={t("selectDistrictFromList")}
              >
                <HomeGlobe locale={locale} />
              </MapErrorBoundary>
            </div>
          </div>

          {/* Districts column (search moved to hero for new template) */}
          <div style={{ marginTop: 16 }} className="md:mt-0">

            {/* Active district cards */}
            {activeDistricts.length > 0 && (
              <ActiveDistrictsCard
                locale={locale}
                activeDistricts={activeDistricts}
                districtPreviews={districtPreviews}
                t={t}
              />
            )}
          </div>
        </div>
      </div>

      {/* Remaining sections — full width, stacked */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {/* Live Data Preview cards */}
        <LiveDataPreview locale={locale} />

        {/* Sector trends from recent news */}
        <GlobalTrendsSection locale={locale} />

        {/* How It Works */}
        <HowItWorks />

        {/* District Request voting */}
        <DistrictRequestSection />

        {/* Disclaimer */}
        <DisclaimerStrip t={t} />
      </div>
    </main>
  );
}

// ── Shared subcomponents ─────────────────────────────────────────────────────

function ActiveDistrictsCard({
  locale, activeDistricts, districtPreviews, t,
}: {
  locale: string;
  activeDistricts: Array<(typeof FRONTEND_STATES)[number]["districts"][number] & { _stateSlug: string }>;
  districtPreviews: DistrictPreview[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 18, padding: "16px", boxShadow: "var(--shadow-card)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--color-selected-bg)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 999, padding: "4px 10px", fontSize: 11, color: "var(--color-brand-strong)", fontWeight: 700 }}>
          <span style={{ width: 7, height: 7, background: "var(--color-accent-green)", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 3px rgba(22,163,74,0.12)" }} />
          {t("liveDistricts", { count: activeDistricts.length })}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeDistricts.map((d) => {
          const preview = districtPreviews.find((p) => p.slug === d.slug);
          return (
            <Link key={d.slug} href={`/${locale}/${d._stateSlug}/${d.slug}`}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "12px 14px",
                background: "linear-gradient(180deg, rgba(224,236,255,0.55), rgba(238,244,255,0.20))",
                border: "1px solid rgba(37,99,235,0.18)",
                borderRadius: 14,
                textDecoration: "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{d.name}</span>
                  {preview?.healthGrade && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px",
                      background: gradeColor(preview.healthGrade).bg,
                      color: gradeColor(preview.healthGrade).text,
                      borderRadius: 4,
                    }}>
                      {preview.healthGrade}
                    </span>
                  )}
                  {isNewDistrict(d.slug) && (
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 8px",
                      background: "#D1FAE5", color: "#065F46",
                      borderRadius: 10,
                    }}>
                      {t("newBadge")}
                    </span>
                  )}
                </div>
                {d.nameLocal && (
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-regional)" }}>{d.nameLocal}</div>
                )}
                {d.tagline && (
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>{d.tagline}</div>
                )}
                {/* Badges + weather */}
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {(d.badges ?? []).slice(0, 3).map((b, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 8px", borderRadius: 100,
                      fontSize: 10, fontWeight: 600,
                      background: "rgba(15,23,42,0.04)", color: "var(--color-text-secondary)",
                      border: "1px solid rgba(15,23,42,0.06)",
                    }}>
                      {b.emoji} {b.label}
                    </span>
                  ))}
                  {preview?.weather?.temp != null && (
                    <span style={{ fontSize: 11, color: "var(--color-accent-blue)", fontFamily: "var(--font-mono, monospace)" }}>
                      🌡️ {preview.weather.temp}°C
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-accent-blue)", flexShrink: 0, marginTop: 2 }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DisclaimerStrip({ t }: { t: (key: string) => string }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border-color)",
        padding: "12px 16px",
        fontSize: 11,
        color: "var(--color-text-muted)",
        background: "var(--surface)",
        borderRadius: 14,
        margin: "0 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}
    >
      <span>
        <strong style={{ color: "var(--color-text-secondary)" }}>JanaDhristi</strong> — {t("stripText")}{" "}
        <Link href="/disclaimer" style={{ color: "var(--color-accent-blue)", textDecoration: "none" }}>Disclaimer →</Link>
      </span>
      <span>{t("builtForCitizens")}</span>
    </div>
  );
}
