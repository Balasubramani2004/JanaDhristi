/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PiggyBank } from "lucide-react";
import { useBudget, useRevenue, useAIInsight } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, DataTable, ProgressBar, AIInsightBanner } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { useTranslations } from "next-intl";

function FinancePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const t = useTranslations("financePage");
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: budgetData, isLoading: bLoading } = useBudget(district, state);
  const { data: revenueData, isLoading: rLoading } = useRevenue(district, state);
  const { data: aiInsight } = useAIInsight(district, "finance");

  const entries = budgetData?.data?.entries ?? [];
  const allocations = budgetData?.data?.allocations ?? [];
  const collections = revenueData?.data?.collections ?? [];

  const latestYear = entries.length > 0 ? entries[0].fiscalYear : null;
  const latestEntries = entries.filter((e) => e.fiscalYear === latestYear);
  const latestAllocations = allocations.filter((a) => a.fiscalYear === latestYear);
  const totalAllocated = latestEntries.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = latestEntries.reduce((s, e) => s + e.spent, 0);
  const totalLapsed = latestAllocations.reduce((s, a) => s + a.lapsed, 0);

  const budgetChart = latestEntries.map((e) => ({
    sector: e.sector.length > 12 ? e.sector.slice(0, 12) + "…" : e.sector,
    allocated: Math.round(e.allocated / 10000000),
    spent: Math.round(e.spent / 10000000),
    utilPct: e.allocated > 0 ? Math.round((e.spent / e.allocated) * 100) : 0,
  }));

  const revChart = collections.slice(0, 12).map((c) => ({
    label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][c.month - 1]}`,
    amount: Math.round(c.amount / 100000),
    target: c.target ? Math.round(c.target / 100000) : 0,
  })).reverse();

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={PiggyBank} title={t("title")} description={t("subtitle")} backHref={base} />

      {/* AI-crawler readable summary */}
      {(() => {
        const sc = getStateConfig(state);
        const stateFinSource = sc ? `${sc.name} Finance Department, PFMS, eGramSwaraj` : "State Finance Department, PFMS, eGramSwaraj";
        return (
          <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 16, padding: "12px 16px", background: "#FAFAF8", borderRadius: 8, borderLeft: "3px solid #7C3AED" }}>
            {t("descriptionPrefix")} {stateFinSource}. {t("descriptionSuffix")}
          </p>
        );
      })()}
      {aiInsight && (
        <AIInsightBanner
          headline={aiInsight.headline}
          summary={aiInsight.summary}
          sentiment={aiInsight.sentiment}
          confidence={aiInsight.confidence}
          sourceUrls={aiInsight.sourceUrls}
          createdAt={aiInsight.createdAt}
        />
      )}
      {(() => { const _src = getModuleSources("budget", state); return <DataSourceBanner moduleName="budget" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="budget" district={district} />
      {bLoading && <LoadingShell rows={4} />}
      {!bLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label={t("totalBudget")} value={`₹${(totalAllocated / 10000000).toFixed(0)}Cr`} icon={PiggyBank} />
            <StatCard label={t("spent")} value={totalSpent === 0 && totalAllocated > 0 ? t("dataPending") : `₹${(totalSpent / 10000000).toFixed(0)}Cr`} accent="#16A34A" />
            <StatCard label={t("utilisation")} value={totalAllocated > 0 ? (totalSpent === 0 ? t("pending") : `${Math.round((totalSpent / totalAllocated) * 100)}%`) : "—"} />
            <StatCard label={t("lapsedFunds")} value={totalSpent === 0 && totalLapsed === 0 ? "—" : `₹${(totalLapsed / 10000000).toFixed(1)}Cr`} accent="#DC2626" sub={t("fundsNotUtilised")} trend="down" />
          </div>

          {totalSpent === 0 && totalAllocated > 0 && (
            <div style={{ fontSize: 12, color: "#6B6B6B", background: "#F9FAFB", border: "1px solid #E8E8E4", borderRadius: 8, padding: "10px 14px", marginBottom: 20, borderLeft: "3px solid #2563EB" }}>
              {t("allocationInfo")}
            </div>
          )}

          {/* Sector-wise chart */}
          {budgetChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>{latestYear} — {t("sectorBudgetVsSpent")}</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetChart} margin={{ top: 5, right: 10, bottom: 50, left: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9B9B9B" }} tickFormatter={(v) => `₹${v}Cr`} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: "#6B6B6B" }} width={90} />
                    <Tooltip formatter={(v) => [`₹${Number(v)}Cr`, ""]} />
                    <Bar dataKey="allocated" fill="#E8E8E4" radius={[0, 4, 4, 0]} name={t("allocated")} />
                    <Bar dataKey="spent" fill="#2563EB" radius={[0, 4, 4, 0]} name={t("spent")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Lapsed funds — RED section */}
          {allocations.filter((a) => a.lapsed > 0).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>
                <span style={{ color: "#DC2626" }}>⚠ {t("lapsedWarning")}</span>
              </SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allocations.filter((a) => a.lapsed > 0).sort((a, b) => b.lapsed - a.lapsed).map((a) => (
                  <div key={a.id} style={{ background: "#FFF1F0", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{a.department}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#DC2626" }}>
                        ₹{(a.lapsed / 10000000).toFixed(2)}Cr {t("lapsed")}
                      </div>
                    </div>
                    <ProgressBar value={a.spent} max={a.allocated} label={`${a.fiscalYear} · ₹${(a.allocated / 10000000).toFixed(1)}Cr ${t("allocated").toLowerCase()}`} color="#DC2626" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocations table */}
          <SectionLabel>{t("departmentAllocations")}</SectionLabel>
          <DataTable
            columns={[
              { key: "fy", label: t("fy") },
              { key: "dept", label: t("department") },
              { key: "alloc", label: t("allocatedCr"), mono: true, align: "right" },
              { key: "spent", label: t("spentCr"), mono: true, align: "right" },
              { key: "lapsed", label: t("lapsedCr"), mono: true, align: "right" },
            ]}
            rows={allocations.map((a) => ({
              fy: a.fiscalYear,
              dept: a.department,
              alloc: (a.allocated / 10000000).toFixed(2),
              spent: (a.spent / 10000000).toFixed(2),
              lapsed: <span style={{ color: a.lapsed > 0 ? "#DC2626" : "#16A34A", fontWeight: a.lapsed > 0 ? 700 : 400 }}>
                {(a.lapsed / 10000000).toFixed(2)}
              </span>,
            }))}
          />
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="budget" />

      {/* Revenue collections */}
      {!rLoading && revChart.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <SectionLabel>{t("revenueCollections")}</SectionLabel>
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                <Tooltip formatter={(v) => [`₹${Number(v)}L`, ""]} />
                <Bar dataKey="amount" fill="#7C3AED" radius={[4, 4, 0, 0]} name={t("collected")} />
                <Bar dataKey="target" fill="#EDE9FE" radius={[4, 4, 0, 0]} name={t("target")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const t = useTranslations("financePage");
  return (
    <ModuleErrorBoundary moduleName={t("title")}>
      <FinancePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
