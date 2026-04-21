/**
 * JanaDhristi — District Leadership page (5-tier hierarchy).
 *
 *   T1 NATIONAL          — President, Prime Minister
 *   T2 STATE             — Governor, Chief Minister, key state ministers
 *   T3 DISTRICT ADMIN    — Collector, SP, ZP CEO  (IAS / IPS — no party)
 *   T4 ELECTED REPS      — MP + MLAs (party + constituency)
 *   T5 MUNICIPAL & DEPT  — Mayor, Municipal Commissioner, dept heads
 *
 * Data is grouped in the page from the existing Leader.tier column. No
 * tier-to-people mapping is hardcoded in the UI — anything tagged tier=N
 * lands in the corresponding section. Adding a district just means seeding
 * leaders with the right tier numbers.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import Image from "next/image";
import {
  Users, Phone, Mail, Info, Flag, Landmark, Building2, Vote, Briefcase,
} from "lucide-react";
import type { ComponentType } from "react";
import { useLeaders, useAIInsight } from "@/hooks/useRealtimeData";
import type { Leader } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock, AIInsightBanner } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import ModuleDisclaimer from "@/components/common/ModuleDisclaimer";
import { getModuleSources } from "@/lib/constants/state-config";
import { getPartyColor } from "@/lib/constants/party-colors";
import { getRoleDescription } from "@/lib/constants/role-descriptions";
import ElectionSection, { findActiveElection, type ElectionEvent } from "@/components/district/ElectionSection";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
import ModuleNews from "@/components/district/ModuleNews";
import MobileHint from "@/components/common/MobileHint";
import { useQuery } from "@tanstack/react-query";

type LucideCmp = ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;

interface TierMeta {
  label: string;
  emoji: string;
  Icon: LucideCmp;
  accent: string;
  hint: string;
}
const TIER_META: Record<number, TierMeta> = {
  1: { label: "National Leadership", emoji: "🇮🇳", Icon: Flag,     accent: "#1E3A8A", hint: "Heads of state and government" },
  2: { label: "State Leadership",    emoji: "🏳",  Icon: Landmark, accent: "#7C3AED", hint: "Governor, Chief Minister and key state ministers" },
  3: { label: "District Administration", emoji: "🏢", Icon: Building2, accent: "#0EA5E9", hint: "IAS / IPS officers running the district day-to-day" },
  4: { label: "Elected Representatives", emoji: "🗳", Icon: Vote, accent: "#16A34A", hint: "MP and MLAs elected by citizens of this district" },
  5: { label: "Municipal & Department Heads", emoji: "🏛", Icon: Briefcase, accent: "#D97706", hint: "Mayor, municipal commissioner and department officers" },
};
function tierMeta(t: number): TierMeta {
  return TIER_META[t] ?? { label: `Tier ${t}`, emoji: "•", Icon: Users, accent: "#6B7280", hint: "" };
}

function formatVerifiedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return null; }
}

function leaderProvenance(l: { source?: string | null; lastVerifiedAt?: string | null }): string {
  const verified = formatVerifiedDate(l.lastVerifiedAt);
  const src = (l.source ?? "").toLowerCase();
  if (src.startsWith("http")) return verified ? `Updated from news · Last verified: ${verified}` : "Updated from news";
  if (src.includes("manual-research")) return verified ? `Manually researched · Last verified: ${verified}` : "Manually researched";
  if (src.includes("seed") || src === "" || src === "manual" || !src) {
    return verified ? `Added from seed data · Last verified: ${verified}` : "Added from seed data";
  }
  return verified ? `Last verified: ${verified}` : "Verification pending";
}

const ATTRIBUTION_TOOLTIP = "As last reported in news media. Political positions and party affiliations change frequently — verify on the official district website.";

function RoleDescription({ text }: { text: string }) {
  // Tap to toggle full text on mobile; desktop also gets clickable expand
  // for accessibility (the title attribute is kept as a hover affordance).
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      title={text}
      style={{
        background: "transparent", border: "none", padding: 0, margin: "3px 0 0",
        textAlign: "left", cursor: "pointer", color: "#9CA3AF", font: "inherit",
        fontSize: 11, lineHeight: 1.4, width: "100%",
        display: "flex", alignItems: "flex-start", gap: 4,
      }}
      aria-expanded={open}
    >
      <span aria-hidden style={{ flexShrink: 0, fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>{open ? "▾" : "▸"}</span>
      <span
        style={open ? undefined : {
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1,
          overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {text}
      </span>
    </button>
  );
}

function LeaderAvatar({
  name, photoUrl, accent,
}: {
  name: string;
  photoUrl?: string | null;
  accent: string;
}) {
  const [imgError, setImgError] = useState(false);
  const isPlaceholder = name.startsWith("[");
  const initials = isPlaceholder
    ? "?"
    : name.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <div style={{
        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", border: `2px solid ${accent}40`,
      }}>
        <Image src={photoUrl} alt={name} width={56} height={56}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </div>
    );
  }
  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
      background: `${accent}18`, border: `2px solid ${accent}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: isPlaceholder ? 22 : 18, fontWeight: 700, color: accent,
    }}>
      {initials}
    </div>
  );
}

function LeaderCard({ l, tierAccent, inElectionPeriod }: { l: Leader; tierAccent: string; inElectionPeriod?: boolean }) {
  // Party-coloured border for political tiers; tier-coloured for bureaucratic.
  const tone = getPartyColor(l.party);
  const isPolitical = !!l.party;
  const accent = isPolitical ? tone.border : tierAccent;
  const isPlaceholderName = l.name.startsWith("[");

  return (
    <div
      style={{
        background: "#FFF",
        border: `1px solid ${isPolitical ? tone.border : "#E8E8E4"}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: "16px 16px 12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 8,
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <LeaderAvatar name={l.name} photoUrl={l.photoUrl} accent={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isPlaceholderName ? "#9B9B9B" : "#1A1A1A", lineHeight: 1.25, fontStyle: isPlaceholderName ? "italic" : "normal" }}>
            {l.name}
          </div>
          {l.nameLocal && !isPlaceholderName && (
            <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 1 }}>
              {l.nameLocal}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#4B5563", marginTop: 3, lineHeight: 1.35 }}>{l.role}</div>
          {(() => {
            const desc = l.roleDescription ?? getRoleDescription(l.role);
            if (!desc) return null;
            return <RoleDescription text={desc} />;
          })()}
          {l.constituency && (
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>📍 {l.constituency}</div>
          )}
          {l.party && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center",
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  color: tone.text, background: tone.bg, border: `1px solid ${tone.border}`,
                }}
              >
                <MobileHint hint={ATTRIBUTION_TOOLTIP}>
                  <span>{l.party}</span>
                </MobileHint>
              </div>
              {inElectionPeriod && (
                <div
                  title="Active election period — affiliations may change after results"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A",
                  }}
                >
                  ⚠ Election period
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(l.phone || l.email) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #F5F5F0" }}>
          {l.phone && (
            <a href={`tel:${l.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#2563EB", textDecoration: "none" }}>
              <Phone size={11} /> {l.phone}
            </a>
          )}
          {l.email && (
            <a href={`mailto:${l.email}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#2563EB", textDecoration: "none" }}>
              <Mail size={11} /> Email
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 6, fontSize: 10, color: "#9B9B9B", fontStyle: "italic" }}>
        {leaderProvenance(l)}
      </div>
    </div>
  );
}

function TierSection({ tier, leaders, isLast, inElectionPeriod }: { tier: number; leaders: Leader[]; isLast: boolean; inElectionPeriod?: boolean }) {
  const meta = tierMeta(tier);
  const TierIcon = meta.Icon;
  return (
    <section style={{ position: "relative", marginBottom: isLast ? 0 : 28 }}>
      {/* Tier header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{meta.emoji}</span>
        <TierIcon size={16} style={{ color: meta.accent }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: meta.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {meta.label}
          </div>
          {meta.hint && <div style={{ fontSize: 11, color: "#9B9B9B" }}>{meta.hint}</div>}
        </div>
        <div style={{ flex: 1, height: 1, background: `${meta.accent}30`, marginLeft: 8 }} />
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {leaders.map((l) => <LeaderCard key={l.id} l={l} tierAccent={meta.accent} inElectionPeriod={inElectionPeriod} />)}
      </div>

      {/* Vertical connector to next tier (skipped on last tier) */}
      {!isLast && (
        <div
          aria-hidden
          style={{
            position: "absolute", left: 18, bottom: -22, width: 2, height: 22,
            background: `${meta.accent}40`,
          }}
        />
      )}
    </section>
  );
}

function LeadershipPageInner({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useLeaders(district, state);
  const { data: aiInsight } = useAIInsight(district, "leadership");
  const leaders: Leader[] = data?.data ?? [];

  // Used for the election-period top banner + per-card "Election period" badge.
  const { data: electionsData } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", state],
    queryFn: () => fetch(`/api/data/elections?state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const liveElection = findActiveElection(electionsData?.data);
  const inElectionPeriod = liveElection != null;

  // Group by tier; sort cards within a tier by importance heuristics
  // (President before PM, Governor before CM, MP before MLAs).
  const ROLE_ORDER: Array<RegExp> = [
    /^president\b/i,
    /^prime minister/i,
    /^governor/i,
    /^chief minister/i,
    /^deputy chief minister/i,
    /\bunion minister\b|\bmp\b|member of parliament/i,
    /^district collector|deputy commissioner/i,
    /^superintendent of police|commissioner of police/i,
    /^ceo/i,
    /^mla\b|member of legislative/i,
    /^mayor/i,
    /^municipal commissioner/i,
  ];
  function rank(role: string): number {
    for (let i = 0; i < ROLE_ORDER.length; i++) if (ROLE_ORDER[i].test(role)) return i;
    return ROLE_ORDER.length + 1;
  }

  // Deduplicate leaders by name (case-insensitive) within the same tier.
  // Catches duplicates like "Narendra Modi / Prime Minister / BJP" vs
  // "Narendra Modi / Prime Minister of India / Bharatiya Janata Party".
  // Also filters out entries where the name is just a role echo (e.g. name="Prime Minister").
  const ROLE_WORDS = /^(prime minister|president|governor|chief minister|minister|mla|mp|speaker|collector|commissioner|mayor|judge|officer|secretary|chairman|director)/i;
  const deduped = leaders
    .filter((l) => !ROLE_WORDS.test(l.name.trim()) || l.name.includes(" ") && l.name.split(/\s+/).length > 2)
    .filter((l, i, arr) =>
      arr.findIndex((x) =>
        x.name.toLowerCase() === l.name.toLowerCase() && x.tier === l.tier
      ) === i
    );

  const byTier = deduped.reduce((acc: Record<number, Leader[]>, l) => {
    (acc[l.tier] ??= []).push(l);
    return acc;
  }, {});
  const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
  for (const t of tiers) byTier[t].sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));

  const lastTier = tiers[tiers.length - 1];

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Users}
        title="District Leadership"
        description="Who governs this district — from the President down to your MLA"
        backHref={base}
      />
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
      {(() => { const _src = getModuleSources("leaders", state); return <DataSourceBanner moduleName="leaders" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}

      <ModuleDisclaimer
        text="Leader information is sourced from publicly available government records (Election Commission of India, state assembly websites, and district administration portals) and may have delays. For official verification, always refer to the original source."
      />

      <div
        role="note"
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
          fontSize: 12, lineHeight: 1.55,
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Leadership data reflects the latest available information. Political positions and party affiliations change frequently. Verify current officeholders at the official district administration website.
        </span>
      </div>

      <LiveElectionBanner stateSlug={state} leadershipHref={base + "/leadership"} />

      {inElectionPeriod && liveElection && (
        <div
          role="alert"
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            fontSize: 12, lineHeight: 1.55, fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>⚠</span>
          <span>
            <strong>ELECTION PERIOD:</strong>{" "}
            This district is currently in an active election period ({liveElection.label}).
            Leadership positions and party affiliations may change following the election results
            {liveElection.resultDate ? ` on ${new Date(liveElection.resultDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}` : ""}.
            JanaDhristi is not affiliated with any political party and does not endorse any candidate.
          </span>
        </div>
      )}

      <AIInsightCard module="leaders" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && leaders.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 24px", background: "#F9F9F7", border: "1px dashed #D0D0CC", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>No leadership data yet</div>
          <div style={{ fontSize: 13, color: "#9B9B9B", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
            Data on elected representatives and officials for this district will be updated soon.
          </div>
        </div>
      )}

      {tiers.map((t) => (
        <TierSection key={t} tier={t} leaders={byTier[t]} isLast={t === lastTier} inElectionPeriod={inElectionPeriod} />
      ))}

      <ElectionSection stateSlug={state} />

      <ModuleNews district={district} state={state} locale={locale} module="leaders" />

      {leaders.length > 0 && (
        <div
          role="note"
          style={{
            background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 8,
            padding: 16, marginTop: 28,
            fontSize: 12, color: "#4B5563", lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#1A1A1A" }}>Note on political affiliations:</strong>{" "}
          Political party affiliations shown are as last reported and may not reflect current affiliations due to party
          changes, cabinet reshuffles, or elections. Government officers (IAS, IPS) carry no party. JanaDhristi does
          not endorse or oppose any political party or individual.
          <br /><br />
          <strong style={{ color: "#1A1A1A" }}>On bureaucrat names:</strong>{" "}
          IAS/IPS officer names change with transfers and may not reflect the most recent postings. Verify current
          district officers at the official district website.
        </div>
      )}
    </div>
  );
}

export default function LeadershipPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Leadership">
      <LeadershipPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
