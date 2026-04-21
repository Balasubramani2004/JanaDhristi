/**
 * ForThePeople.in — Overview-page election alert.
 *
 * Renders a prominent red banner only when the district's state has an
 * active ElectionEvent with polling within 30 days. Otherwise renders
 * nothing (no shell), so quiet states stay calm.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ElectionEvent } from "@/components/district/ElectionSection";

function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function LiveElectionBanner({
  stateSlug, leadershipHref,
}: {
  stateSlug: string;
  leadershipHref: string;
}) {
  const { data } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/elections?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const events = data?.data ?? [];
  const live = events.find((e) => {
    const d = daysFromToday(e.pollingDate);
    return d != null && d >= 0 && d <= 30 && e.state === stateSlug;
  });
  if (!live || !live.pollingDate) return null;

  const days = daysFromToday(live.pollingDate)!;
  const phaseSummary = live.pollingPhases && live.pollingPhases.length > 1
    ? live.pollingPhases.map((p) => `Phase ${p.phase}: ${formatDay(p.date)}`).join(", ")
    : `Polling on ${formatDay(live.pollingDate)}`;

  return (
    <Link
      href={leadershipHref}
      style={{
        display: "block", textDecoration: "none",
        marginBottom: 16, borderRadius: 10, padding: "12px 16px",
        background: "#FEF2F2", border: "1px solid #FCA5A5",
        color: "#991B1B",
        boxShadow: "0 1px 3px rgba(220,38,38,0.08)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45 }}>
        🗳 {live.label} — {phaseSummary}
        {days <= 14 ? <span style={{ marginLeft: 8, fontWeight: 600 }}>({days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} away`})</span> : null}
      </div>
      {live.resultDate && (
        <div style={{ fontSize: 12, marginTop: 3, color: "#7F1D1D" }}>
          Results: {formatDay(live.resultDate)} · Check leadership page for details →
        </div>
      )}
    </Link>
  );
}
