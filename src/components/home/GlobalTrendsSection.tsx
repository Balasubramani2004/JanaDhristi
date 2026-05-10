/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";

type TrendItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  districtSlug: string;
  stateSlug: string;
};

type TrendSector = {
  slug: string;
  label: string;
  items: TrendItem[];
};

export default function GlobalTrendsSection({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const { data, isLoading } = useQuery<{ sectors: TrendSector[] }>({
    queryKey: ["homepage-trends"],
    queryFn: () => fetch("/api/data/homepage-trends").then((r) => r.json()),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ height: 120, background: "var(--surface-muted)", borderRadius: 14 }} />
      </div>
    );
  }

  const sectors = data?.sectors ?? [];
  if (sectors.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 16px" }}>
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
          {t("trendsSectionSubtitle")}
        </p>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {sectors.map((sec) => (
          <div
            key={sec.slug}
            style={{
              borderRadius: 14,
              padding: "14px 14px 12px",
              border: "1px solid var(--border-color)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-brand-strong)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }} aria-hidden>📌</span>
              {sec.label}
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
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 4 }}>
                    {item.source}
                    {" · "}
                    <Link
                      href={`/${locale}/${item.stateSlug}/${item.districtSlug}/news`}
                      style={{ color: "var(--color-accent-blue)", textDecoration: "none" }}
                    >
                      {t("trendsDistrictNews")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
