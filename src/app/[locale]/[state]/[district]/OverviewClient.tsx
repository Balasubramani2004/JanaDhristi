/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Overview Client Dashboard
// ═══════════════════════════════════════════════════════════
"use client";

import Link from "next/link";
import {
  MapPin, Users, TreePine, Percent, Activity,
  BarChart3, Cloud,
  Shield, ScrollText, HardHat, TrendingUp, Newspaper,
} from "lucide-react";
import {
  useOverview, useCropPrices, useWeather, useWater,
  useInfrastructure, useBudget, usePolice, useNews,
} from "@/hooks/useRealtimeData";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { StatCard, SectionLabel, CardGrid, LoadingShell, LiveBadge } from "@/components/district/ui";
import EmptyState from "@/components/district/EmptyState";
import AIInsightCard from "@/components/common/AIInsightCard";
import { DistrictHealthScoreCard } from "@/components/district/DistrictHealthScoreCard";
import { getStateConfig } from "@/lib/constants/state-config";
import DistrictHeroIllustration from "@/components/district/DistrictHeroIllustration";
import InfraSnippet from "@/components/district/InfraSnippet";
import LeadersSnippet from "@/components/district/LeadersSnippet";
import TenderSnippet from "@/components/district/TenderSnippet";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
import type { DistrictBadge } from "@/lib/constants/districts";
import { useTranslations } from "next-intl";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  stateName: string;
  districtData: {
    name: string;
    nameLocal?: string;
    tagline?: string;
    population?: number | null;
    area?: number | null;
    talukCount?: number;
    villageCount?: number | null;
    literacy?: number | null;
    sexRatio?: number | null;
    active: boolean;
    badges?: DistrictBadge[];
    taluks: Array<{ slug: string; name: string; nameLocal?: string; tagline?: string }>;
  };
}

// ── Module categories for the overview grid ──────────────
const MODULE_CATEGORIES = [
  {
    label: "📊 Live Data",
    slugs: ["crops", "weather", "water", "population", "police"],
  },
  {
    label: "🏛️ Governance & Services",
    slugs: ["leadership", "finance", "schemes", "services"],
  },
  {
    label: "🏘️ Community & Infrastructure",
    slugs: ["transport", "jjm", "housing", "power", "schools"],
  },
  {
    label: "📜 Transparency & Rights",
    slugs: ["gram-panchayat", "health"],
  },
  {
    label: "🤝 Local Info",
    slugs: ["offices", "citizen-corner", "famous-personalities", "tourism", "news"],
  },
  {
    label: "🏭 Local Economy",
    slugs: ["industries", "farm", "map", "data-sources", "responsibility"],
  },
];

// Modules with live/frequently-updated data
const LIVE_MODULES = new Set(["crops", "weather", "water", "news", "power"]);

const CATEGORY_COLORS: Record<string, string> = {
  agriculture: "var(--color-accent-green)",
  water: "#0d9488",
  politics: "#7C3AED",
  crime: "var(--color-accent-red)",
  health: "var(--color-accent-amber)",
  education: "#0891B2",
  infrastructure: "var(--color-accent-amber)",
  weather: "#0891B2",
  economy: "var(--color-accent-green)",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OverviewClient({ locale, stateSlug, districtSlug, stateName, districtData }: Props) {
  const t = useTranslations("overview");
  const tm = useTranslations("modules");
  const getModuleLabel = (slug: string, fallback: string) => {
    const keyMap: Record<string, string | undefined> = {
      finance: "budget",
      power: "power",
      leadership: "leadership",
      crops: "crops",
      weather: "weather",
      water: "dams",
      infrastructure: "infrastructure",
      schemes: "schemes",
      police: "police",
      transport: "transport",
      schools: "schools",
      housing: "housing",
      offices: "offices",
      services: "services",
      news: "news",
      "gram-panchayat": "panchayat",
      responsibility: "responsibility",
      jjm: "jjm",
      "famous-personalities": "famous",
      tourism: "tourism",
      industries: "sugar",
      farm: "soil",
    };
    const key = keyMap[slug];
    return key ? tm(key) : fallback;
  };
  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const stateConfig = getStateConfig(stateSlug);
  const { data: overview } = useOverview(districtSlug, stateSlug);
  const dbTalukCount = overview?.data?.taluks?.length;
  const displayedTalukCount = dbTalukCount ?? districtData.talukCount;
  const { data: crops, isLoading: cropsLoading } = useCropPrices(districtSlug, stateSlug);
  const { data: weather, isLoading: weatherLoading } = useWeather(districtSlug, stateSlug);
  const { data: water, isLoading: waterLoading } = useWater(districtSlug, stateSlug);
  const { data: infraData } = useInfrastructure(districtSlug, stateSlug);
  const { data: budgetData, isLoading: budgetLoading } = useBudget(districtSlug, stateSlug);
  const { data: policeData, isLoading: policeLoading } = usePolice(districtSlug, stateSlug);
  const { data: newsData, isLoading: newsLoading } = useNews(districtSlug, stateSlug);

  const latestCrops = crops?.data?.slice(0, 5) ?? [];
  const latestWeather = weather?.data?.[0];
  const latestDam = water?.data?.dams?.[0];
  const ongoingProjects = (infraData?.data ?? [])
    .filter((p) => p.status === "ongoing" || p.status === "active" || p.status === "under_construction")
    .slice(0, 4);

  // Finance summary — use latest fiscal year only (matches finance page)
  const allBudgetEntries = budgetData?.data?.entries ?? [];
  const latestFY = allBudgetEntries.length > 0 ? allBudgetEntries[0].fiscalYear : null;
  const budgetEntries = latestFY ? allBudgetEntries.filter((e) => e.fiscalYear === latestFY) : [];
  const totalAllocated = budgetEntries.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = budgetEntries.reduce((s, e) => s + e.spent, 0);
  const spentPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Police summary
  const policeStations = policeData?.data?.stations ?? [];
  const trafficRows = policeData?.data?.traffic ?? [];
  const trafficRevenue = trafficRows.reduce((s, t) => s + t.amount, 0);

  // News
  const newsItems = (newsData?.data ?? []).slice(0, 5);

  return (
    <div style={{ padding: "0" }}>

      {/* ── District Hero with SVG Illustration ─── */}
      <DistrictHeroIllustration
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtData.name}
        stateName={stateName}
        districtNameLocal={districtData.nameLocal}
        tagline={districtData.tagline}
        badges={districtData.badges}
        active={districtData.active}
        stats={{
          population: districtData.population ? `${(districtData.population / 1000000).toFixed(2)}M` : undefined,
          area: districtData.area ? districtData.area.toLocaleString("en-IN") : undefined,
          literacy: districtData.literacy ? `${districtData.literacy}%` : undefined,
          subDistrictCount: displayedTalukCount,
          subDistrictLabel: stateConfig?.subDistrictUnitPlural ?? "Taluks",
        }}
      />

      <div style={{ padding: "20px 24px 24px" }}>
        <LiveElectionBanner stateSlug={stateSlug} leadershipHref={`${base}/leadership`} />

        <AIInsightCard module="overview" district={districtSlug} />
        <DistrictHealthScoreCard districtSlug={districtSlug} />

        {/* ── Live Data Row ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12, marginBottom: 24 }}>

          {/* Weather Widget */}
          <Link href={`${base}/weather`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(37,99,235,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.05)"; }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderLeft: "4px solid var(--color-accent-blue)", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px color-mix(in srgb, var(--color-accent-blue) 12%, transparent)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--color-selected-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cloud size={15} style={{ color: "var(--color-accent-blue)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{tm("weather")}</span>
                </div>
                <LiveBadge />
              </div>
              {weatherLoading ? <LoadingShell rows={2} /> : latestWeather ? (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)", letterSpacing: "-2px", lineHeight: 1 }}>
                    {latestWeather.temperature != null ? `${latestWeather.temperature}°` : "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>{latestWeather.conditions ?? "—"}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                    {latestWeather.humidity != null && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>💧 {latestWeather.humidity}%</span>}
                    {latestWeather.windSpeed != null && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>🌬 {latestWeather.windSpeed} km/h</span>}
                  </div>
                </div>
              ) : <EmptyState module="weather" compact />}
            </div>
          </Link>

          {/* Dam Level Widget */}
          <Link href={`${base}/water`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(217,119,6,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.05)"; }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderLeft: "4px solid #D97706", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px color-mix(in srgb, var(--color-accent-blue) 12%, transparent)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--color-selected-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🚰</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t("damLevels")}</span>
                </div>
                <LiveBadge />
              </div>
              {waterLoading ? <LoadingShell rows={2} /> : latestDam ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>{latestDam.damName}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-1px", lineHeight: 1, color: latestDam.storagePct > 70 ? "var(--color-accent-green)" : latestDam.storagePct > 30 ? "var(--color-accent-amber)" : "var(--color-accent-red)" }}>
                      {latestDam.storagePct.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                  </div>
                  <div style={{ marginTop: 10, background: "var(--surface-muted)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, latestDam.storagePct)}%`, height: "100%", background: latestDam.storagePct > 70 ? "var(--color-accent-blue)" : latestDam.storagePct > 30 ? "var(--color-accent-amber)" : "var(--color-accent-red)", borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 5 }}>
                    {latestDam.waterLevel.toFixed(1)} / {latestDam.maxLevel.toFixed(1)} ft
                  </div>
                </div>
              ) : <EmptyState module="water" compact />}
            </div>
          </Link>

          {/* Crop Prices Widget */}
          <Link href={`${base}/crops`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(22,163,74,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.05)"; }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderLeft: "4px solid #16A34A", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px rgba(22,163,74,0.05)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🌾</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t("mandiPrices")}</span>
                </div>
                <LiveBadge />
              </div>
              {cropsLoading ? <LoadingShell rows={3} /> : latestCrops.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {latestCrops.map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--foreground)" }}>{c.commodity}</span>
                      <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-accent-green)" }}>
                        ₹{Math.round(c.modalPrice / 100).toLocaleString("en-IN")}
                        <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 400 }}>/kg</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState module="crops" compact />}
            </div>
          </Link>
        </div>

        {/* ── District Snapshot ─────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>{t("districtSnapshot")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
            <StatCard label={t("population")} value={districtData.population?.toLocaleString("en-IN") ?? "—"} icon={Users} />
            <StatCard label={t("area")} value={districtData.area?.toLocaleString("en-IN") ?? "—"} icon={TreePine} />
            <StatCard label={stateConfig?.subDistrictUnitPlural ?? "Taluks"} value={displayedTalukCount ?? "—"} icon={MapPin} />
            {(stateConfig?.showVillages !== false) && <StatCard label={t("villages")} value={districtData.villageCount?.toLocaleString("en-IN") ?? "—"} icon={MapPin} />}
            <StatCard label={t("literacy")} value={districtData.literacy ? `${districtData.literacy}%` : "—"} icon={Percent} accent="var(--color-accent-green)" />
            <StatCard label={t("sexRatio")} value={districtData.sexRatio ? `${districtData.sexRatio}/1k` : "—"} icon={Activity} />
            <StatCard label={tm("schemes")} value={overview?.data?._count?.schemes?.toString() ?? "—"} icon={ScrollText} />
            <StatCard label={tm("schools")} value={overview?.data?._count?.schools?.toString() ?? "—"} icon={BarChart3} />
          </div>
        </div>

        {/* ── District Leadership snippet — auto-hides if 0 leaders ── */}
        <LeadersSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />

        {/* ── Infrastructure At a Glance — auto-hides if 0 projects ── */}
        <InfraSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />

        {/* ── Govt. Tenders snippet — always renders (lock/live/stale/no-data).
            No outer wrapper: the snippet carries its own marginBottom:24,
            matching LeadersSnippet + InfraSnippet for consistent alignment. */}
        <TenderSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />

        {/* ── Ongoing Projects ─────────────────────────── */}
        {ongoingProjects.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionLabel action={<Link href={`${base}/map`} style={{ fontSize: 12, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 500 }}>{t("seeMap")}</Link>}>
              {t("ongoingProjects")}
            </SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {ongoingProjects.map((p) => {
                const pct = p.progressPct ?? 0;
                const catColors: Record<string, string> = {
                  Roads: "var(--color-accent-amber)", Irrigation: "#0d9488", "Urban Development": "#7C3AED",
                  Health: "var(--color-accent-red)", Education: "var(--color-accent-green)",
                };
                const catColor = catColors[p.category] ?? "var(--color-text-secondary)";
                return (
                  <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4 }}>{p.name}</div>
                        {p.contractor && (
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                            <HardHat size={10} style={{ display: "inline", marginRight: 3 }} />
                            {p.contractor}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: catColor + "18", color: catColor, borderRadius: 20, flexShrink: 0 }}>
                        {p.category}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{t("progress")}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 75 ? "var(--color-accent-green)" : pct >= 40 ? "var(--color-accent-amber)" : "var(--color-accent-red)", fontFamily: "var(--font-mono)" }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 6, background: "var(--surface-muted)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? "var(--color-accent-green)" : pct >= 40 ? "var(--color-accent-amber)" : "var(--color-accent-red)", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                    {p.budget && (
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8 }}>
                        <span>₹{(p.budget / 1e7).toFixed(0)} {t("crBudget")}</span>
                        {p.expectedEnd && <span>· {t("due")} {new Date(p.expectedEnd).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Finance & Budget Summary — hidden entirely when no data ── */}
        {(budgetLoading || budgetEntries.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/finance`} style={{ fontSize: 12, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 500 }}>{t("fullReport")}</Link>}>
            {tm("budget")}
          </SectionLabel>
          <Link href={`${base}/finance`} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {budgetLoading ? (
                <LoadingShell rows={3} />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("totalAllocated")}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(totalAllocated / 1e7).toFixed(0)} Cr
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("totalSpent")}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-accent-green)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(totalSpent / 1e7).toFixed(0)} Cr
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("utilisation")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: spentPct >= 75 ? "var(--color-accent-green)" : spentPct >= 50 ? "var(--color-accent-amber)" : "var(--color-accent-red)", fontFamily: "var(--font-mono)", letterSpacing: "-1px", lineHeight: 1 }}>
                          {spentPct.toFixed(1)}%
                        </div>
                        <TrendingUp size={14} style={{ color: spentPct >= 75 ? "var(--color-accent-green)" : "var(--color-accent-amber)" }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-muted)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, spentPct)}%`, height: "100%", background: spentPct >= 75 ? "var(--color-accent-green)" : spentPct >= 50 ? "var(--color-accent-amber)" : "var(--color-accent-red)", borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                    {t("sectorsTracked", { count: budgetEntries.length })}
                  </div>
                </>
              )}
            </div>
          </Link>
        </div>
        )}

        {/* ── Police & Crime Summary — hidden entirely when no data ── */}
        {(policeLoading || policeStations.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/police`} style={{ fontSize: 12, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 500 }}>{t("stationDirectory")}</Link>}>
            {t("policePublicSafety")}
          </SectionLabel>
          <Link href={`${base}/police`} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {policeLoading ? (
                <LoadingShell rows={2} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("policeStations")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFF1F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={15} style={{ color: "var(--color-accent-red)" }} />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                        {policeStations.length}
                      </div>
                    </div>
                  </div>
                  {trafficRevenue > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("trafficRevenue")}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-accent-amber)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(trafficRevenue / 1e5).toFixed(1)}L
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        </div>
        )}

        {/* ── Local News — hidden entirely when no items and not loading ── */}
        {(newsLoading || newsItems.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/news`} style={{ fontSize: 12, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 500 }}>{t("allNews")}</Link>}>
            {t("localNews")}
          </SectionLabel>
          {newsLoading ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "18px 20px" }}>
              <LoadingShell rows={4} />
            </div>
          ) : newsItems.length === 0 ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "24px 20px", textAlign: "center" }}>
              <Newspaper size={28} style={{ color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{t("noNewsYet")}</div>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 14, overflow: "hidden" }}>
              {newsItems.map((item, idx) => {
                const catColor = CATEGORY_COLORS[item.category?.toLowerCase()] ?? "var(--color-text-secondary)";
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 18px",
                      borderBottom: idx < newsItems.length - 1 ? "1px solid var(--border-color)" : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4, marginBottom: 4 }}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                            {item.headline}
                          </a>
                        ) : item.headline}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{item.source}</span>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>·</span>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{timeAgo(item.publishedAt)}</span>
                        {item.category && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 7px",
                            background: catColor + "18", color: catColor,
                            borderRadius: 20, textTransform: "capitalize",
                          }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ── Taluks ────────────────────────────────────── */}
        {districtData.taluks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>{stateConfig?.subDistrictUnitPlural ?? "Taluks"} {t("inDistrict", { district: districtData.name })}</SectionLabel>
            <CardGrid>
              {districtData.taluks.map((t) => (
                <Link
                  key={t.slug}
                  href={`${base}/${t.slug}`}
                  style={{ display: "block", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: 10, textDecoration: "none" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{t.name}</div>
                  {t.nameLocal && (
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-regional)", marginTop: 2 }}>{t.nameLocal}</div>
                  )}
                  {t.tagline && (
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>{t.tagline}</div>
                  )}
                </Link>
              ))}
            </CardGrid>
          </div>
        )}

        {/* ── All Data Modules — Categorized Grid ──────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>{t("allDataModules", { count: SIDEBAR_MODULES.length - 1 })}</SectionLabel>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {MODULE_CATEGORIES.map((cat) => {
              const mods = cat.slugs
                .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
                .filter(Boolean) as typeof SIDEBAR_MODULES;
              if (!mods.length) return null;

              return (
                <div key={cat.label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    {cat.label}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 8,
                    }}
                    className="module-grid"
                  >
                    {mods.map((mod) => {
                      const isLive = LIVE_MODULES.has(mod.slug);
                      const href = mod.slug === "overview" ? base : `${base}/${mod.slug}`;
                      return (
                        <Link
                          key={mod.slug}
                          href={href}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            padding: "12px 12px 10px",
                            background: "var(--surface)",
                            border: "1px solid var(--border-color)",
                            borderRadius: 12,
                            textDecoration: "none",
                            color: "var(--foreground)",
                            position: "relative",
                            transition: "border-color 150ms, box-shadow 150ms",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                            (e.currentTarget as HTMLElement).style.setProperty("border-color", "var(--color-accent-blue)");
                            (e.currentTarget as HTMLElement).style.setProperty("background", "var(--color-brand-soft)");
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                            (e.currentTarget as HTMLElement).style.setProperty("border-color", "var(--border-color)");
                            (e.currentTarget as HTMLElement).style.setProperty("background", "var(--surface)");
                          }}
                        >
                          {isLive && (
                            <div style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-accent-green)" }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--color-accent-green)", letterSpacing: "0.04em" }}>{t("live")}</span>
                            </div>
                          )}
                          <span style={{ fontSize: 20, marginBottom: 8, lineHeight: 1 }}>{mod.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3, wordBreak: "break-word", hyphens: "auto" }}>
                            {getModuleLabel(mod.slug, mod.label)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
