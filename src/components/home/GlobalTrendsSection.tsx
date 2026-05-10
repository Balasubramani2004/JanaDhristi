/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type TrendItem = {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  publishedAt: string;
  url: string;
};

type TrendModule = {
  module: string;
  label: string;
  items: TrendItem[];
};

const MODULE_VISUAL: Record<
  string,
  { icon: string; pillBg: string; pillBorder: string; pillColor: string; rail: string }
> = {
  crops: {
    icon: "🌾",
    pillBg: "color-mix(in srgb, var(--color-brand-strong) 12%, transparent)",
    pillBorder: "color-mix(in srgb, var(--color-brand-strong) 35%, transparent)",
    pillColor: "var(--color-brand-strong)",
    rail: "color-mix(in srgb, #16a34a 55%, var(--color-brand-strong))",
  },
  weather: {
    icon: "🌤",
    pillBg: "color-mix(in srgb, #0ea5e9 14%, transparent)",
    pillBorder: "color-mix(in srgb, #0ea5e9 40%, transparent)",
    pillColor: "#0369a1",
    rail: "#0ea5e9",
  },
  water: {
    icon: "💧",
    pillBg: "color-mix(in srgb, #0284c7 12%, transparent)",
    pillBorder: "color-mix(in srgb, #0284c7 38%, transparent)",
    pillColor: "#075985",
    rail: "#0284c7",
  },
  power: {
    icon: "⚡",
    pillBg: "color-mix(in srgb, #eab308 18%, transparent)",
    pillBorder: "color-mix(in srgb, #ca8a04 45%, transparent)",
    pillColor: "#854d0e",
    rail: "#ca8a04",
  },
  health: {
    icon: "🏥",
    pillBg: "color-mix(in srgb, #ec4899 12%, transparent)",
    pillBorder: "color-mix(in srgb, #db2777 35%, transparent)",
    pillColor: "#9d174d",
    rail: "#db2777",
  },
  infrastructure: {
    icon: "🏗",
    pillBg: "color-mix(in srgb, var(--foreground) 8%, transparent)",
    pillBorder: "var(--border-color)",
    pillColor: "var(--foreground)",
    rail: "var(--color-brand-strong)",
  },
  finance: {
    icon: "💰",
    pillBg: "color-mix(in srgb, #22c55e 12%, transparent)",
    pillBorder: "color-mix(in srgb, #15803d 35%, transparent)",
    pillColor: "#14532d",
    rail: "#15803d",
  },
  transport: {
    icon: "🚌",
    pillBg: "color-mix(in srgb, #6366f1 14%, transparent)",
    pillBorder: "color-mix(in srgb, #4f46e5 38%, transparent)",
    pillColor: "#312e81",
    rail: "#4f46e5",
  },
  news: {
    icon: "📰",
    pillBg: "color-mix(in srgb, var(--color-text-muted) 15%, transparent)",
    pillBorder: "var(--border-color)",
    pillColor: "var(--color-text-secondary)",
    rail: "var(--color-text-muted)",
  },
};

const DEFAULT_VISUAL = MODULE_VISUAL.news!;

function moduleVisual(module: string) {
  return MODULE_VISUAL[module.toLowerCase()] ?? DEFAULT_VISUAL;
}

function relativeUpdatedLabel(isoDates: string[]): string {
  if (isoDates.length === 0) return "";
  const newest = Math.max(...isoDates.map((d) => new Date(d).getTime()));
  const diffMs = Date.now() - newest;
  if (diffMs < 0) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function GlobalTrendsSection({ locale: _locale }: { locale: string }) {
  const t = useTranslations("home");
  const { data, isLoading, isError } = useQuery<{ modules: TrendModule[]; error?: boolean }>({
    queryKey: ["global-trends"],
    queryFn: () => fetch("/api/data/global-trends").then((r) => r.json()),
    staleTime: 300_000,
  });

  const modules = data?.modules ?? [];

  const headerBlock = useMemo(
    () => (
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          {t("trendsSectionTitle")}
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
          Module-wise global headlines from trusted publishers; list refreshes on a schedule.
        </p>
      </div>
    ),
    [t],
  );

  if (isLoading) {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        {headerBlock}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="animate-pulse"
              style={{
                height: 160,
                borderRadius: 14,
                background: "var(--surface-muted)",
                border: "1px solid var(--border-color)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || data?.error) {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        {headerBlock}
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          Global trends could not be loaded. Please try again later.
        </p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        {headerBlock}
        <div
          style={{
            borderRadius: 14,
            padding: "16px 18px",
            border: "1px solid var(--border-color)",
            background: "var(--surface-muted)",
            fontSize: 13,
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          No global trends are available yet — check back in a few hours after the next refresh.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 16px" }}>
      {headerBlock}

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {modules.map((sec) => {
          const vis = moduleVisual(sec.module);
          const updated = relativeUpdatedLabel(sec.items.map((i) => i.publishedAt));
          return (
            <div
              key={sec.module}
              style={{
                borderRadius: 14,
                padding: "14px 14px 12px",
                border: "1px solid var(--border-color)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
                borderLeft: `3px solid ${vis.rail}`,
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden>
                    {vis.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: vis.pillBg,
                      border: `1px solid ${vis.pillBorder}`,
                      color: vis.pillColor,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {sec.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Updated {updated}
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--foreground)",
                        textDecoration: "none",
                        lineHeight: 1.35,
                        display: "block",
                      }}
                    >
                      {item.title}
                    </a>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        fontSize: 10,
                        color: "var(--color-text-muted)",
                        lineHeight: 1.3,
                      }}
                    >
                      <span
                        title={item.source}
                        style={{
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "color-mix(in srgb, var(--surface-muted) 85%, var(--surface))",
                          border: "1px solid var(--border-color)",
                          fontWeight: 600,
                        }}
                      >
                        {item.source}
                      </span>
                      <span style={{ opacity: 0.85 }}>
                        {new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
