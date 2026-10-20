/**
 * JanaDhristi — Compact leadership snippet for the district overview.
 *
 * Shows the four key positions citizens look for first:
 *   👤 Collector  (T3 District Collector / Deputy Commissioner)
 *   👮 SP         (T3 Superintendent of Police / Commissioner of Police)
 *   🗳 MP         (T4 row whose role mentions MP / Member of Parliament)
 *   📋 MLAs       (count + per-party tally for T4 rows whose role starts MLA)
 *
 * Renders nothing if the district has zero leaders, so empty districts
 * don't show a hollow shell. Links to /leadership for the full hierarchy.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import type { Leader } from "@/hooks/useRealtimeData";
import { getPartyColor } from "@/lib/constants/party-colors";
import { useTranslations } from "next-intl";

interface ApiResponse { data: Leader[]; meta?: unknown }

function isCollector(l: Leader): boolean {
  return /^(district collector|deputy commissioner)\b/i.test(l.role);
}
function isSP(l: Leader): boolean {
  return /^(superintendent of police|commissioner of police)\b/i.test(l.role);
}
function isMP(l: Leader): boolean {
  return /\bmp\b|member of parliament|union minister/i.test(l.role);
}
function isMLA(l: Leader): boolean {
  return /^mla\b|member of legislative assembly/i.test(l.role);
}

export default function LeadersSnippet({
  locale, district, state, base,
}: {
  locale: string; district: string; state: string; base: string;
}) {
  const t = useTranslations("snippets");
  const { data } = useQuery<ApiResponse>({
    queryKey: ["district", district, "leaders", "snippet", locale],
    queryFn: () => fetch(`/api/data/leaders?district=${district}&state=${state}&locale=${locale}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const leaders = data?.data ?? [];
  if (leaders.length === 0) return null;

  const collector = leaders.find(isCollector);
  const sp = leaders.find(isSP);
  const mp = leaders.find(isMP);
  const mlas = leaders.filter(isMLA);
  const partyTally = mlas.reduce<Record<string, number>>((acc, l) => {
    const k = l.party ?? "Other";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const partyLine = Object.entries(partyTally)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p}: ${n}`)
    .join(", ");

  // Bureaucrat names that are placeholders (e.g. "[Verify at mandya.nic.in]")
  // render in italic grey so users see the action item, not a fake person.
  const renderName = (l: Leader | undefined, fallback: string) => {
    if (!l) return <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>{fallback}</span>;
    if (l.name.startsWith("[")) return <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>{l.name}</span>;
    return <strong style={{ color: "#1A1A1A" }}>{l.name}</strong>;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={14} style={{ color: "#7C3AED" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {t("districtLeadership")}
          </span>
        </div>
        <Link
          href={`${base}/leadership`}
          style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}
        >
          {t("viewAll")}
        </Link>
      </div>

      <div
        style={{
          background: "#FFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column", gap: 8,
          fontSize: 13, color: "#1A1A1A",
        }}
      >
        <div>
          👤 {t("collector")}: {renderName(collector, t("verifyDistrictWebsite"))}
        </div>
        <div>
          👮 {t("sp")}: {renderName(sp, t("verifyPoliceWebsite"))}
        </div>
        <div>
          🗳 {t("mp")}: {mp ? (
            <>
              <strong style={{ color: "#1A1A1A" }}>{mp.name}</strong>
              {mp.party && (() => {
                const tone = getPartyColor(mp.party);
                return <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 12, color: tone.text, background: tone.bg, border: `1px solid ${tone.border}` }}>{mp.party}</span>;
              })()}
            </>
          ) : <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>{t("notYetRecorded")}</span>}
        </div>
        <div>
          📋 {t("mlas")}: {mlas.length > 0 ? (
            <>
              <strong style={{ color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>{mlas.length}</strong>
              {partyLine && <span style={{ color: "#6B6B6B" }}> ({partyLine})</span>}
            </>
          ) : <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>{t("notYetRecorded")}</span>}
        </div>
      </div>
    </div>
  );
}
