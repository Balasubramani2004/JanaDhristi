/**
 * Rendered on /tenders pages when District.tendersActive === false.
 * Tells the visitor tenders for this district aren't tracked yet + offers
 * a sponsor CTA to prioritise activation. Also lists currently-live
 * districts so they can find coverage elsewhere.
 *
 * The sidebar still renders "Govt. Tenders" for every district (intentional
 * discoverability). This component is the gated entry-point content.
 */

"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Props {
  locale: string;
  stateSlug: string;
  stateName: string;
  districtSlug: string;
  districtName: string;
}

interface LiveDistrict {
  districtSlug: string;
  districtName: string;
  stateSlug: string;
  stateName: string;
}

export default function TenderLockedState({
  locale,
  stateSlug,
  stateName,
  districtSlug,
  districtName,
}: Props) {
  // Fetch other districts that DO have tenders active — this page is the
  // best discovery surface for "what's covered today".
  const { data: liveList } = useQuery<{ districts: LiveDistrict[] }>({
    queryKey: ["tenders-live-districts"],
    queryFn: () => fetch("/api/tenders/live-districts").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const liveElsewhere = (liveList?.districts ?? []).filter(
    (d) => d.districtSlug !== districtSlug,
  );

  return (
    <div style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Lock badge + title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={30} color="#EA580C" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
            Tender tracking for {districtName} is coming soon
          </h1>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.65, maxWidth: 620, margin: "0 auto" }}>
            We&rsquo;re aggregating procurement data from {stateName}&rsquo;s
            government eProc portals. Support the project to prioritise your
            district — each supporter shortens the wait for a new district to
            come online.
          </p>
        </div>

        {/* What's covered elsewhere */}
        {liveElsewhere.length > 0 && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Currently tracked
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {liveElsewhere.map((d) => (
                <li key={d.districtSlug}>
                  <Link
                    href={`/${locale}/${d.stateSlug}/${d.districtSlug}/tenders`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "#F9FAFB",
                      borderRadius: 8,
                      textDecoration: "none",
                      color: "#0F172A",
                      fontSize: 14,
                    }}
                  >
                    <span>
                      <strong>{d.districtName}</strong>
                      <span style={{ color: "#6B7280", fontSize: 12, marginLeft: 8 }}>{d.stateName}</span>
                    </span>
                    <ArrowRight size={14} color="#6B7280" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
