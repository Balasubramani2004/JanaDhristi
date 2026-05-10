/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Preview {
  topCrops: { commodity: string; modalPrice: number; date: string; districtId: string }[];
  latestNews: { title: string; source: string; publishedAt: string; districtId: string }[];
  latestDams: { damName: string; storagePct: number; districtId: string }[];
  districtPreviews: {
    slug: string;
    stateSlug?: string;
    weather: { temp: number | null; conditions: string | null } | null;
  }[];
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function damBar(pct: number) {
  const color =
    pct > 70
      ? "var(--color-accent-green)"
      : pct > 40
        ? "var(--color-accent-amber)"
        : "var(--color-accent-red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ flex: 1, height: 6, background: "var(--surface-muted)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--color-text-secondary)", minWidth: 36 }}>
        {pct}%
      </span>
    </div>
  );
}

function PreviewCard({
  emoji,
  title,
  children,
  link,
  linkLabel = "View all →",
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
  link: string;
  linkLabel?: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: "18px 18px 14px",
        flex: 1,
        minWidth: 220,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
      </div>
      <div style={{ marginBottom: 12 }}>{children}</div>
      <Link
        href={link}
        style={{ fontSize: 12, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 600 }}
      >
        {linkLabel}
      </Link>
    </div>
  );
}

export default function LiveDataPreview({ locale }: { locale: string }) {
  const th = useTranslations("home");
  const { data, isLoading } = useQuery<Preview>({
    queryKey: ["homepage-preview"],
    queryFn: () => fetch("/api/data/homepage-preview").then((r) => r.json()),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "0 16px", display: "flex", gap: 12, overflowX: "auto" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 16,
              padding: 18,
              minWidth: 220,
              height: 140,
              flex: 1,
            }}
          />
        ))}
      </div>
    );
  }

  const firstDistrict = data?.districtPreviews?.[0];
  const firstSlug = firstDistrict?.slug ?? "mandya";
  const firstState = firstDistrict?.stateSlug ?? "karnataka";

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          padding: "16px 16px 8px",
        }}
      >
        {th("previewLiveStrip")}
      </div>
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 12, overflowX: "auto" }}>
        {/* Crop Prices */}
        <PreviewCard
          emoji="🌾"
          title={th("previewCropsTitle")}
          link={`/${locale}/${firstState}/${firstSlug}/crops`}
          linkLabel="All prices →"
        >
          {data?.topCrops?.length ? (
            data.topCrops.map((c) => (
              <div key={c.commodity} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.commodity}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: "var(--color-accent-green)" }}>
                  ₹{c.modalPrice.toLocaleString("en-IN")}/qtl
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No data available</span>
          )}
        </PreviewCard>

        {/* Dam Levels */}
        <PreviewCard
          emoji="🚰"
          title={th("previewDamsTitle")}
          link={`/${locale}/${firstState}/${firstSlug}/water`}
          linkLabel="Full report →"
        >
          {data?.latestDams?.length ? (
            data.latestDams.map((d) => (
              <div key={d.damName} style={{ marginBottom: 2 }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>{d.damName}</div>
                {damBar(d.storagePct)}
              </div>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No data available</span>
          )}
        </PreviewCard>

        {/* News */}
        <PreviewCard
          emoji="📰"
          title={th("previewNewsTitle")}
          link={`/${locale}/${firstState}/${firstSlug}/news`}
          linkLabel="All news →"
        >
          {data?.latestNews?.length ? (
            data.latestNews.map((n, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {n.source} · {timeAgo(n.publishedAt)}
                </div>
              </div>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No data available</span>
          )}
        </PreviewCard>

        {/* Weather */}
        <PreviewCard
          emoji="🌦️"
          title={th("previewWeatherTitle")}
          link={`/${locale}/${firstState}/${firstSlug}/weather`}
          linkLabel="Full forecast →"
        >
          {data?.districtPreviews?.length ? (
            data.districtPreviews.map((d) => (
              <div key={d.slug} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{d.slug}</span>
                {d.weather ? (
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: "var(--color-accent-blue)" }}>
                    {d.weather.temp !== null ? `${d.weather.temp}°C` : "–"}
                    {d.weather.conditions ? ` ${d.weather.conditions.includes("rain") ? "🌧️" : d.weather.conditions.includes("cloud") ? "⛅" : "☀️"}` : ""}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>–</span>
                )}
              </div>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No data available</span>
          )}
        </PreviewCard>
      </div>
    </div>
  );
}
