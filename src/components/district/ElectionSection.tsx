/**
 * JanaDhristi — Election section for the leadership page.
 *
 * Renders all elections relevant to the district's state (national +
 * state-level rows). Cards are colour-coded by urgency:
 *   PAST (date < today)              → grey ✅ Completed
 *   < 14 days                        → red 🔴 LIVE / VOTING IN N DAYS
 *   < 6 months                       → amber 🟠 APPROACHING
 *   < 2 years                        → yellow 🟡 UPCOMING
 *   ≥ 2 years                        → grey ⚪ SCHEDULED
 *
 * Includes a footer disclaimer clarifying that JanaDhristi is not
 * affiliated with the ECI or any political party.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { Vote, AlertTriangle } from "lucide-react";

interface PollingPhase { phase: number; date: string }
export interface ElectionEvent {
  id: string;
  type: string;
  label: string;
  state: string | null;
  district: string | null;
  lastHeld: string | null;
  pollingDate: string | null;
  pollingPhases: PollingPhase[] | null;
  resultDate: string | null;
  nextExpected: string | null;
  termYears: number;
  totalSeats: number | null;
  body: string;
  note: string | null;
  source: string | null;
  isActive: boolean;
}

interface UrgencyTone { bg: string; border: string; text: string; label: string }
function urgencyTone(daysAway: number | null, isPast: boolean): UrgencyTone {
  if (isPast) return { bg: "#F3F4F6", border: "#D1D5DB", text: "#6B7280", label: "✅ Completed" };
  if (daysAway == null) return { bg: "#F3F4F6", border: "#D1D5DB", text: "#6B7280", label: "⚪ Scheduled" };
  if (daysAway <= 14) return { bg: "#FEF2F2", border: "#DC2626", text: "#991B1B", label: `🔴 VOTING IN ${daysAway} DAY${daysAway === 1 ? "" : "S"}` };
  if (daysAway <= 180) return { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E", label: "🟠 APPROACHING" };
  if (daysAway <= 730) return { bg: "#FEFCE8", border: "#CA8A04", text: "#854D0E", label: "🟡 UPCOMING" };
  return { bg: "#F3F4F6", border: "#D1D5DB", text: "#6B7280", label: "⚪ SCHEDULED" };
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function formatMonthYear(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

function ElectionCard({ e }: { e: ElectionEvent }) {
  const target = e.pollingDate ?? e.nextExpected;
  const days = daysFromToday(target);
  const isPast = days != null && days < 0;
  const tone = urgencyTone(days, isPast);
  const isLive = !isPast && days != null && days <= 14;
  return (
    <div
      style={{
        background: "#FFF",
        border: `1px solid ${tone.border}`,
        borderTop: `4px solid ${tone.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "2px 10px",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
          background: tone.bg, color: tone.text, border: `1px solid ${tone.border}`,
          borderRadius: 20, marginBottom: 8,
          animation: isLive ? "ftpPulse 1.6s ease-in-out infinite" : undefined,
        }}
      >
        {tone.label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
        🗳 {e.label}
      </div>
      {e.pollingDate && (
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>
          📅 Polling: <strong>{formatFullDate(e.pollingDate)}</strong>
          {days != null && !isPast ? <> — <span style={{ color: tone.text, fontWeight: 600 }}>{days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} away`}</span></> : null}
        </div>
      )}
      {e.pollingPhases && e.pollingPhases.length > 1 && (
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 3 }}>
          {e.pollingPhases.map((p) => `Phase ${p.phase}: ${formatFullDate(p.date)}`).join(" · ")}
        </div>
      )}
      {e.resultDate && (
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>
          📊 Results: <strong>{formatFullDate(e.resultDate)}</strong>
        </div>
      )}
      {e.lastHeld && !e.pollingDate && (
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>
          Last held: <strong>{formatMonthYear(e.lastHeld)}</strong>
        </div>
      )}
      {e.nextExpected && !e.pollingDate && (
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>
          Next expected: <strong>~{formatMonthYear(e.nextExpected)}</strong>
          {days != null ? <span style={{ color: tone.text }}> ({Math.abs(Math.round(days / 30))} months away)</span> : null}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>
        🏛 {e.totalSeats ? `${e.totalSeats} seats · ` : ""}{e.body}
      </div>
      {e.note && (
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, fontStyle: "italic" }}>{e.note}</div>
      )}
      {isLive && (
        <div
          style={{
            display: "flex", alignItems: "flex-start", gap: 6,
            marginTop: 10, paddingTop: 8,
            borderTop: `1px dashed ${tone.border}`,
            fontSize: 11, color: tone.text, lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>During the election period, leadership data may change rapidly. Party affiliations and positions shown are as last reported.</span>
        </div>
      )}
    </div>
  );
}

export default function ElectionSection({ stateSlug }: { stateSlug: string }) {
  const { data, isLoading } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/elections?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  if (isLoading || !data?.data?.length) return null;
  const events = data.data;
  return (
    <section style={{ marginTop: 32, marginBottom: 24 }}>
      <style>{`@keyframes ftpPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); } 50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Vote size={16} style={{ color: "#7C3AED" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Elections
        </span>
        <div style={{ flex: 1, height: 1, background: "#E0E7FF", marginLeft: 8 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {events.map((e) => <ElectionCard key={e.id} e={e} />)}
      </div>
      <div
        role="note"
        style={{
          background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 8,
          padding: 14, marginTop: 16,
          fontSize: 11, color: "#4B5563", lineHeight: 1.6,
        }}
      >
        Election dates and schedules are sourced from the Election Commission of India (eci.gov.in).
        JanaDhristi is an independent citizen transparency platform and is not affiliated with,
        endorsed by, or acting on behalf of the Election Commission of India or any political party.
        This is not an official election information portal. For official election information, visit{" "}
        <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>eci.gov.in</a>{" "}
        or contact your local District Election Officer.
      </div>
    </section>
  );
}

// Helper used by the leadership page to detect an election period for
// disclaimer rendering. Returns the nearest election within 30 days
// (past or future) or null.
export function findActiveElection(events: ElectionEvent[] | undefined): ElectionEvent | null {
  if (!events) return null;
  const today = Date.now();
  const candidates = events.filter((e) => {
    const t = e.pollingDate ? new Date(e.pollingDate).getTime() : null;
    if (t == null) return false;
    return Math.abs(t - today) <= 30 * 86_400_000;
  });
  candidates.sort((a, b) => Math.abs(new Date(a.pollingDate!).getTime() - today) - Math.abs(new Date(b.pollingDate!).getTime() - today));
  return candidates[0] ?? null;
}
