"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface FinanceSummary {
  revenue: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    supporterCount: number;
    supportersThisWeek: number;
    trendPct: { month: number; week: number };
  };
  monthlyBreakdown: Array<{ month: string; revenue: number; expense: number; net: number }>;
}

const REVENUE_HELP =
  "Revenue tracks all contributions. Razorpay payments are recorded automatically via webhook. For offline payments (UPI, bank transfer, cash), use 'Add Manual Supporter' to record them. All supporters appear on the public Contributor Wall unless marked private. Use the ⚙️ edit button to change tier, visibility, or sponsored district.";

function Trend({ pct }: { pct: number }) {
  if (pct === 0)
    return (
      <span style={{ fontSize: 11, color: "#9B9B9B", display: "inline-flex", alignItems: "center", gap: 2 }}>
        <Minus size={10} /> flat
      </span>
    );
  const up = pct > 0;
  return (
    <span
      style={{
        fontSize: 11,
        color: up ? "#16A34A" : "#DC2626",
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default function RevenueSummary({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<FinanceSummary | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/finance-summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: FinanceSummary | null) => d && setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!data) {
    return (
      <div style={{ fontSize: 13, color: "#9B9B9B", padding: "12px 0" }}>Loading revenue summary...</div>
    );
  }

  const { revenue, monthlyBreakdown } = data;
  const cards = [
    {
      label: "Total Revenue",
      value: `₹${revenue.total.toLocaleString("en-IN")}`,
      sub: `${revenue.supporterCount} supporters`,
      color: "#7C3AED",
    },
    {
      label: "This Month",
      value: `₹${revenue.thisMonth.toLocaleString("en-IN")}`,
      sub: <Trend pct={revenue.trendPct.month} />,
      color: "#2563EB",
    },
    {
      label: "This Week",
      value: `₹${revenue.thisWeek.toLocaleString("en-IN")}`,
      sub: <Trend pct={revenue.trendPct.week} />,
      color: "#16A34A",
    },
    {
      label: "New Supporters (7d)",
      value: String(revenue.supportersThisWeek),
      sub: `${revenue.supporterCount} total`,
      color: "#D97706",
    },
  ];

  const maxMonth = Math.max(...monthlyBreakdown.map((m) => m.revenue), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
          Revenue & Supporters
        </h2>
        <ModuleHelp text={REVENUE_HELP} size={14} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9B9B9B",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              {c.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: "var(--font-mono, monospace)" }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown chart */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>
          Revenue by Month (last 12)
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
          {monthlyBreakdown.map((m) => {
            const h = maxMonth > 0 ? (m.revenue / maxMonth) * 70 : 0;
            return (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 0,
                }}
                title={`${m.month}: ₹${m.revenue.toLocaleString("en-IN")} · exp ₹${m.expense.toLocaleString(
                  "en-IN"
                )} · net ₹${m.net.toLocaleString("en-IN")}`}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${h}px`,
                    minHeight: 2,
                    background: m.revenue > 0 ? "#2563EB" : "#E8E8E4",
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: 9, color: "#9B9B9B" }}>{m.month.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
