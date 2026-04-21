/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
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
    staleTime: 300_000,
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
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            Expanding Across Karnataka Districts
          </span>
          <span style={{ fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-mono, monospace)" }}>
            {activeCount} / {totalKarnatakaDistricts} live
          </span>
        </div>
        <div style={{ background: "#F5F5F0", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 12 }}>
          <div
            style={{
              width: `${totalKarnatakaDistricts > 0 ? (activeCount / totalKarnatakaDistricts) * 100 : 0}%`,
              height: "100%",
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              borderRadius: 4,
              minWidth: 8,
            }}
          />
        </div>

        {topRequest && (
          <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600, marginBottom: 12 }}>
            🔥 Most requested: {topRequest.districtName}, {topRequest.stateName} ({topRequest.requestCount} requests)
          </div>
        )}

        {submitted ? (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "#16A34A",
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
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                color: "#1A1A1A",
                background: "#FAFAF8",
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
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                color: selectedDistrict ? "#1A1A1A" : "#9B9B9B",
                background: "#FAFAF8",
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
                background: selectedState && selectedDistrict ? "#2563EB" : "#E8E8E4",
                color: selectedState && selectedDistrict ? "#fff" : "#9B9B9B",
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
