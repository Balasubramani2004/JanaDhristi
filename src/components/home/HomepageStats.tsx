/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Stats {
  activeDistricts: number;
  modulesPerDistrict: number;
  totalDataPoints: number;
  mostRecentAt: string | null;
  plannedDistricts: number;
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "–";
  const diff = (Date.now() - new Date(isoStr).getTime()) / 60000; // minutes
  if (diff < 1) return "< 1 min ago";
  if (diff < 60) return `${Math.round(diff)} min ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(diff / 1440);
  if (days <= 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(isoStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function StatCard({ value, label, mono = true }: { value: string; label: string; mono?: boolean }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: "16px 14px",
        textAlign: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--color-accent-blue)",
          fontFamily: mono ? "var(--font-mono, monospace)" : "var(--font-plus-jakarta, system-ui, sans-serif)",
          letterSpacing: "-1px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

export default function HomepageStats() {
  const { data } = useQuery<Stats>({
    queryKey: ["homepage-stats"],
    queryFn: () => fetch("/api/data/homepage-stats").then((r) => r.json()),
    staleTime: 300_000,
  });

  // Drive the count-up animation from real values only. While the API is in
  // flight we render an em-dash so users never see "0 Districts LIVE" during
  // a cold function start.
  const districts = useCountUp(data?.activeDistricts ?? 0);
  const modules = useCountUp(data?.modulesPerDistrict ?? 29);
  const dataPoints = useCountUp(data?.totalDataPoints ?? 0);
  const ready = !!data;

  return (
    <div>
      <div className="grid grid-cols-2 md:flex" style={{ gap: 8, padding: "12px 16px 0" }}>
        <StatCard value={ready ? `${districts}` : "—"} label="Districts LIVE" />
        <StatCard value={ready ? `${modules}` : "—"} label="Dashboards / District" />
        <StatCard
          value={ready ? dataPoints.toLocaleString("en-IN") : "—"}
          label="Data Points Tracked"
        />
        <StatCard value={`${(data?.plannedDistricts ?? 780).toLocaleString("en-IN")}+`} label="Districts Coming" />
        <div className="hidden md:contents">
          <StatCard value={data?.mostRecentAt ? timeAgo(data.mostRecentAt) : "Live"} label="Last Updated" mono={false} />
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", marginTop: 8 }}>
        Data refreshes every 5–30 minutes from official government portals
      </p>
    </div>
  );
}
