/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Shared District Dashboard UI Components
// ═══════════════════════════════════════════════════════════
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

// ── Module Page Header ──────────────────────────────────
export function ModuleHeader({
  icon: Icon,
  title,
  description,
  backHref,
  liveTag,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref: string;
  liveTag?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("districtUi");
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: 20,
        marginBottom: 24,
      }}
    >
      <Link
        href={backHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--color-text-muted)",
          textDecoration: "none",
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={13} />
        {t("backToOverview")}
      </Link>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: "var(--color-brand-soft)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 10px 22px color-mix(in srgb, var(--color-accent-blue) 18%, transparent)",
          }}
        >
          <Icon size={20} style={{ color: "var(--color-accent-blue)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--foreground)",
                letterSpacing: "-0.4px",
              }}
            >
              {title}
            </h1>
            {liveTag && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--color-accent-green)",
                  background: "rgba(22, 163, 74, 0.10)",
                  border: "1px solid rgba(22, 163, 74, 0.25)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                ● LIVE
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Last Updated Badge ──────────────────────────────────
export function LastUpdatedBadge({ lastUpdated }: { lastUpdated?: string | null }) {
  if (!lastUpdated) return null;
  const date = new Date(lastUpdated);
  const label = date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";
  return (
    <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10 }}>🕐</span> Last updated: {label}
    </span>
  );
}

// ── Stat Card ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const color = accent ?? "var(--color-accent-blue)";
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {Icon && <Icon size={13} style={{ color }} />}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-data"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--foreground)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color:
              trend === "up"
                ? "var(--color-accent-green)"
                : trend === "down"
                ? "var(--color-accent-red)"
                : "var(--color-text-muted)",
            marginTop: 4,
          }}
        >
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Section Label ───────────────────────────────────────
export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
      {action}
    </div>
  );
}

// ── Cards Grid ──────────────────────────────────────────
export function CardGrid({
  children,
  cols = "repeat(auto-fill, minmax(200px, 1fr))",
}: {
  children: React.ReactNode;
  cols?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

// ── Data Table ──────────────────────────────────────────
export function DataTable({
  columns,
  rows,
  emptyText,
}: {
  columns: { key: string; label: string; mono?: boolean; align?: "right" | "left" }[];
  rows: Record<string, React.ReactNode>[];
  emptyText?: string;
}) {
  const t = useTranslations("districtUi");
  if (!rows.length) {
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontSize: 13,
        }}
      >
        {emptyText ?? t("noDataAvailable")}
      </div>
    );
  }
  return (
    <div className="data-table-scroll"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textAlign: col.align === "right" ? "right" : "left",
                  background: "var(--background)",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid rgba(220, 228, 245, 0.7)" : "none",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--foreground)",
                    fontFamily: col.mono ? "var(--font-mono)" : "inherit",
                    textAlign: col.align === "right" ? "right" : "left",
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Info Card ───────────────────────────────────────────
export function InfoCard({
  title,
  subtitle,
  badge,
  badgeColor,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: subtitle || children ? 10 : 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {badge && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: badgeColor ?? "var(--color-accent-blue)",
                background: badgeColor ? `${badgeColor}18` : "var(--color-brand-soft)",
                padding: "2px 8px",
                borderRadius: 20,
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Progress Bar ────────────────────────────────────────
export function ProgressBar({
  value,
  max = 100,
  pct: pctProp,
  color,
  height = 8,
  label,
}: {
  value?: number;
  max?: number;
  pct?: number;
  color?: string;
  height?: number;
  label?: string;
}) {
  const pct = pctProp !== undefined
    ? Math.min(100, pctProp)
    : Math.min(100, Math.round(((value ?? 0) / max) * 100));
  const barColor =
    color ??
    (pct >= 75
      ? "var(--color-accent-green)"
      : pct >= 40
        ? "var(--color-accent-amber)"
        : "var(--color-accent-red)");
  return (
    <div>
      {label !== undefined && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--color-text-secondary)",
            marginBottom: 4,
          }}
        >
          <span>{label}</span>
          <span
            className="font-data"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {pct}%
          </span>
        </div>
      )}
      <div
        style={{
          background: "color-mix(in srgb, var(--color-border) 65%, transparent)",
          borderRadius: height,
          height,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: barColor,
            height: "100%",
            width: `${pct}%`,
            borderRadius: height,
            transition: "width 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Loading Shell ───────────────────────────────────────
export function LoadingShell({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 56,
            background:
              "linear-gradient(90deg, var(--surface-muted) 25%, color-mix(in srgb, var(--color-border) 80%, transparent) 50%, var(--surface-muted) 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 10,
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}

// ── Error Block ─────────────────────────────────────────
export function ErrorBlock({ message }: { message?: string }) {
  const t = useTranslations("districtUi");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 16px",
        background: "rgba(220, 38, 38, 0.06)",
        border: "1px solid rgba(220, 38, 38, 0.22)",
        borderRadius: 10,
        fontSize: 13,
        color: "var(--color-accent-red)",
      }}
    >
      <AlertCircle size={16} />
      {message ?? t("failedToLoad")}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────
export function EmptyBlock({ message, icon }: { message?: string; icon?: string }) {
  const t = useTranslations("districtUi");
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--color-text-muted)",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon ?? "📭"}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
        {message ?? t("noDataYet")}
      </p>
      <p style={{ fontSize: 12 }}>{t("districtDataSoon")}</p>
    </div>
  );
}

// ── Live Badge ──────────────────────────────────────────
export function LiveBadge() {
  const t = useTranslations("districtUi");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: "var(--color-accent-green)",
        background: "rgba(22, 163, 74, 0.10)",
        border: "1px solid rgba(22, 163, 74, 0.22)",
        padding: "2px 7px",
        borderRadius: 20,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          background: "var(--color-accent-green)",
          borderRadius: "50%",
        }}
      />
      {t("live")}
    </span>
  );
}

// ── Cache Badge ─────────────────────────────────────────
export function CacheBadge({ fromCache }: { fromCache?: boolean }) {
  const t = useTranslations("districtUi");
  if (!fromCache) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color: "var(--color-text-muted)",
      }}
    >
      <RefreshCw size={10} />
      {t("cached")}
    </span>
  );
}

// ── Last Updated ────────────────────────────────────────
export function LastUpdated({
  updatedAt,
  onRefetch,
}: {
  updatedAt?: string | null;
  onRefetch?: () => void;
}) {
  const [hover, setHover] = React.useState(false);

  if (!updatedAt) return null;

  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);

  let ago: string;
  if (diffMins < 1) ago = "just now";
  else if (diffMins < 60) ago = `${diffMins} min ago`;
  else if (diffMins < 1440) ago = `${Math.round(diffMins / 60)}h ago`;
  else ago = `${Math.round(diffMins / 1440)}d ago`;

  const exactIST = date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      title={`Last updated: ${exactIST} IST`}
      onClick={onRefetch}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: hover ? "var(--color-accent-blue)" : "var(--color-text-muted)",
        cursor: onRefetch ? "pointer" : "default",
        userSelect: "none",
        transition: "color 150ms ease",
        padding: "2px 0",
        flexShrink: 0,
      }}
    >
      <RefreshCw size={11} style={{ transition: "transform 300ms ease", transform: hover ? "rotate(180deg)" : "none" }} />
      <span>{ago}</span>
    </div>
  );
}

// ── Alert Badge ─────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, [string, string]> = {
    critical: ["var(--color-accent-red)", "color-mix(in srgb, var(--color-accent-red) 14%, white)"],
    high: ["var(--color-accent-amber)", "color-mix(in srgb, var(--color-accent-amber) 18%, white)"],
    medium: ["var(--color-accent-blue)", "var(--color-selected-bg)"],
    info: ["var(--color-text-muted)", "var(--surface-muted)"],
    low: ["var(--color-accent-green)", "color-mix(in srgb, var(--color-accent-green) 14%, white)"],
  };
  const [color, bg] = map[severity.toLowerCase()] ?? map.info;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        padding: "2px 8px",
        borderRadius: 20,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {severity}
    </span>
  );
}

// ── AI Insight Banner ────────────────────────────────────
export function AIInsightBanner({
  headline,
  summary,
  sentiment,
  confidence,
  sourceUrls,
  createdAt,
}: {
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  sourceUrls?: string[];
  createdAt?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const sentimentColor =
    sentiment === "positive"
      ? "var(--color-accent-green)"
      : sentiment === "negative"
        ? "var(--color-accent-red)"
        : "var(--color-text-muted)";
  const sentimentBg =
    sentiment === "positive"
      ? "color-mix(in srgb, var(--color-accent-green) 14%, white)"
      : sentiment === "negative"
        ? "color-mix(in srgb, var(--color-accent-red) 14%, white)"
        : "var(--surface-muted)";

  const confidencePct = Math.round(confidence * 100);

  return (
    <div
      style={{
        background: "var(--color-brand-soft)",
        border: "1px solid color-mix(in srgb, var(--color-accent-blue) 35%, var(--border-color))",
        borderLeft: "4px solid var(--color-accent-blue)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Brain icon area */}
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--color-selected-bg)",
            border: "1px solid color-mix(in srgb, var(--color-accent-blue) 35%, var(--border-color))",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 14,
          }}
        >
          🧠
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent-blue)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              AI Intelligence
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: sentimentColor, background: sentimentBg, padding: "1px 6px", borderRadius: 20 }}>
              {sentiment}
            </span>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "monospace" }}>
              {confidencePct}% confidence
            </span>
            {createdAt && (
              <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: "auto" }}>
                {new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>

          {/* Headline */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4, marginBottom: 4 }}>
            {headline}
          </div>

          {/* Summary (expandable) */}
          <p
            style={{
              fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {summary}
          </p>

          {/* Expand/collapse + sources */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                fontSize: 11, color: "var(--color-accent-blue)", background: "none",
                border: "none", padding: 0, cursor: "pointer",
              }}
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
            {expanded && sourceUrls && sourceUrls.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                {sourceUrls.slice(0, 2).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "var(--color-accent-blue)", textDecoration: "none" }}
                  >
                    Source {i + 1} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
