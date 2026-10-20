/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FRONTEND_STATES } from "@/lib/constants/districts";

interface TopRequest {
  id: string;
  stateName: string;
  districtName: string;
  requestCount: number;
}

export default function DistrictRequestSection() {
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const karnatakaState = FRONTEND_STATES.find((s) => s.slug === "karnataka");
  const totalKarnatakaDistricts = karnatakaState?.districts.length ?? 0;
  const activeCount = karnatakaState?.districts.filter((d) => d.active).length ?? 0;

  const { data } = useQuery<{ top: TopRequest[] }>({
    queryKey: ["district-requests"],
    queryFn: () => fetch("/api/district-request").then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const mutation = useMutation({
    mutationFn: (body: { stateName: string; districtName: string }) =>
      fetch("/api/district-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["district-requests"] });
      setSubmitted(true);
    },
  });

  const stateData = FRONTEND_STATES.find((s) => s.name === selectedState);
  const lockedDistricts = stateData?.districts.filter((d) => !d.active) ?? [];

  function handleRequest() {
    if (!selectedState || !selectedDistrict) return;
    mutation.mutate({ stateName: selectedState, districtName: selectedDistrict });
  }

  const topRequest = data?.top?.[0];

  return (
    <div style={{ padding: "0 16px 16px" }}>
      {/* Progress bar */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-color)",
          borderRadius: 14,
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
            Expanding Across Karnataka Districts
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
            {activeCount} / {totalKarnatakaDistricts} live
          </span>
        </div>
        <div style={{ background: "var(--surface-muted)", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 12 }}>
          <div
            style={{
              width: `${totalKarnatakaDistricts > 0 ? (activeCount / totalKarnatakaDistricts) * 100 : 0}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--color-accent-blue), var(--color-accent-purple))",
              borderRadius: 4,
              minWidth: 8,
            }}
          />
        </div>

        {topRequest && (
          <div style={{ fontSize: 11, color: "var(--color-accent-amber)", fontWeight: 600, marginBottom: 12 }}>
            🔥 Most requested: {topRequest.districtName}, {topRequest.stateName} ({topRequest.requestCount} requests)
          </div>
        )}

        {submitted ? (
          <div
            style={{
              background: "color-mix(in srgb, var(--color-accent-green) 12%, white)",
              border: "1px solid color-mix(in srgb, var(--color-accent-green) 35%, var(--border-color))",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "var(--color-accent-green)",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ✓ Request submitted! We&apos;ll prioritise {selectedDistrict}.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(""); }}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--foreground)",
                background: "var(--surface-muted)",
                outline: "none",
              }}
            >
              <option value="">Select state</option>
              {(karnatakaState ? [karnatakaState] : []).map((s) => (
                <option key={s.slug} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                fontSize: 13,
                color: selectedDistrict ? "var(--foreground)" : "var(--color-text-muted)",
                background: "var(--surface-muted)",
                outline: "none",
                opacity: !selectedState ? 0.5 : 1,
              }}
            >
              <option value="">Select district</option>
              {lockedDistricts.map((d) => (
                <option key={d.slug} value={d.name}>{d.name}</option>
              ))}
            </select>

            <button
              onClick={handleRequest}
              disabled={!selectedState || !selectedDistrict || mutation.isPending}
              style={{
                padding: "8px 16px",
                background: selectedState && selectedDistrict ? "var(--color-accent-blue)" : "var(--border-color)",
                color: selectedState && selectedDistrict ? "#fff" : "var(--color-text-muted)",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedState && selectedDistrict ? "pointer" : "default",
                transition: "background 0.15s",
                minHeight: 44,
              }}
            >
              {mutation.isPending ? "…" : "Request →"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
