/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";
import { FormEvent, use, useState } from "react";
import Link from "next/link";
import { MapPin, Users, Home, ChevronRight, ArrowLeft, Building2 } from "lucide-react";
import { useTaluks, useOverview, usePanchayats } from "@/hooks/useRealtimeData";
import VillageScatterMap from "@/components/map/VillageScatterMap";
import { getStateConfig } from "@/lib/constants/state-config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type TalukComplaint = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
};

// Taluk overview page — shows taluk stats + village list
export default function TalukPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string }>;
}) {
  const { locale, state, district, taluk: talukSlug } = use(params);
  const districtBase = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const villageLabel = stateConfig?.villageLabel ?? "Villages";
  const showVillages = stateConfig?.showVillages !== false;
  const gramPanchayatApplicable = stateConfig?.gramPanchayatApplicable !== false;
  const jjmApplicable = stateConfig?.jjmApplicable !== false;
  const { data: taluksData } = useTaluks(district, state);
  const { data: overviewData } = useOverview(district, state);
  const { data: panchayatInTaluk } = usePanchayats(district, state, talukSlug, gramPanchayatApplicable);
  const queryClient = useQueryClient();
  const [complaintText, setComplaintText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const talukData = (taluksData?.data ?? []).find((t) => t.slug === talukSlug);
  const districtName = overviewData?.data?.name ?? district;
  const complaintsKey = ["taluk-complaints", state, district, talukSlug] as const;
  const leaderboardKey = ["district-taluk-leaderboard", state, district] as const;

  const complaintsQuery = useQuery<{ totalComplaints: number; complaints: TalukComplaint[] }>({
    queryKey: complaintsKey,
    queryFn: async () => {
      const response = await fetch(`/api/taluks/${talukSlug}/complaints?state=${state}&district=${district}`);
      if (!response.ok) throw new Error("Failed to load complaints");
      return response.json();
    },
    enabled: !!talukData,
  });

  const leaderboardQuery = useQuery<{ leaderboard: Array<{ talukSlug: string; talukName: string; complaints: number }> }>({
    queryKey: leaderboardKey,
    queryFn: async () => {
      const response = await fetch(`/api/taluks/leaderboard?state=${state}&district=${district}`);
      if (!response.ok) throw new Error("Failed to load leaderboard");
      return response.json();
    },
    enabled: !!talukData,
  });

  const submitComplaint = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/taluks/${talukSlug}/complaints?state=${state}&district=${district}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Failed to submit complaint");
      return result;
    },
    onSuccess: async () => {
      setComplaintText("");
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: complaintsKey }),
        queryClient.invalidateQueries({ queryKey: leaderboardKey }),
      ]);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const onSubmitComplaint = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = complaintText.trim();
    if (message.length < 10) {
      setFormError("Please enter at least 10 characters.");
      return;
    }
    if (message.length > 2000) {
      setFormError("Please keep your complaint under 2000 characters.");
      return;
    }
    submitComplaint.mutate(message);
  };

  if (!talukData) {
    return (
      <div style={{ padding: 24 }}>
        <Link href={districtBase} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={13} /> Back to {districtName}
        </Link>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>Loading {subUnit.toLowerCase()}...</div>
      </div>
    );
  }

  const villages = talukData.villages;
  const effectiveVillageCount = talukData._count.villages || talukData.villageCount || 0;
  const hasVillages = showVillages && villages.length > 0;
  const villagePoints = villages
    .filter(
      (v) =>
        v.latitude != null &&
        v.longitude != null &&
        !Number.isNaN(v.latitude) &&
        !Number.isNaN(v.longitude)
    )
    .map((v) => ({
      id: v.id,
      name: v.name,
      latitude: v.latitude as number,
      longitude: v.longitude as number,
    }));
  const talukGramPanchayats = panchayatInTaluk?.data ?? [];
  // Prefer taluk.population from DB (seeded zone population); fall back to sum of villages.
  const villageSum = villages.reduce((s, v) => s + (v.population ?? 0), 0);
  const talukPopulation = talukData.population ?? (villageSum > 0 ? villageSum : null);

  const moduleLinks: Array<{ label: string; href: string; icon: string }> = [
    { label: "Crop Prices", href: `${districtBase}/crops?taluk=${talukSlug}`, icon: "🌾" },
    { label: "Water & Dams", href: `${districtBase}/water?taluk=${talukSlug}`, icon: "💧" },
    { label: "Schools", href: `${districtBase}/schools?taluk=${talukSlug}`, icon: "🎓" },
  ];
  if (gramPanchayatApplicable) {
    moduleLinks.push({ label: "Gram Panchayats", href: `${districtBase}/gram-panchayat?taluk=${talukSlug}`, icon: "🏘️" });
  }
  if (jjmApplicable) {
    moduleLinks.push({ label: "JJM Coverage", href: `${districtBase}/jjm?taluk=${talukSlug}`, icon: "🚰" });
  }
  moduleLinks.push({ label: "Overview", href: districtBase, icon: "📊" });

  const metaLine = hasVillages
    ? `Part of ${districtName} District · ${effectiveVillageCount} ${villageLabel.toLowerCase()}`
    : `Part of ${districtName} District · Urban zone`;

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <Link href={districtBase} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={13} /> {districtName}
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: "1px solid #E8E8E4", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.4px" }}>{talukData.name} {subUnit}</h1>
            {talukData.nameLocal && <div style={{ fontSize: 14, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{talukData.nameLocal}</div>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6 }}>
          {metaLine}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {showVillages && (
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
              <Home size={13} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{villageLabel}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{effectiveVillageCount}</div>
          </div>
        )}
        <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
            <Users size={13} style={{ color: "#16A34A" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Population</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {talukPopulation != null ? talukPopulation.toLocaleString("en-IN") : "—"}
          </div>
        </div>
        {talukData.area != null && (
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
              <MapPin size={13} style={{ color: "#D97706" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Area</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {talukData.area.toLocaleString("en-IN")} km²
            </div>
          </div>
        )}
      </div>

      {villagePoints.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            {villageLabel} map ({villagePoints.length} with coordinates)
          </div>
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 12 }}>
            <VillageScatterMap
              locale={locale}
              state={state}
              district={district}
              talukSlug={talukSlug}
              districtKey={district}
              villages={villagePoints}
            />
          </div>
        </div>
      )}

      {gramPanchayatApplicable && talukGramPanchayats.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Gram panchayats in {talukData.name} ({talukGramPanchayats.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {talukGramPanchayats.map((g) => (
              <div
                key={g.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                }}
              >
                <Building2 size={16} style={{ color: "#2563EB", flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{g.name}</div>
                  {g.nameLocal && (
                    <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{g.nameLocal}</div>
                  )}
                  <Link
                    href={`${districtBase}/gram-panchayat`}
                    style={{ fontSize: 11, color: "#2563EB", marginTop: 6, display: "inline-block" }}
                  >
                    View all panchayat data →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* District module links */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        View Data for This {subUnit}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 28 }}>
        {moduleLinks.map(({ label, href, icon }) => (
          <Link key={label} href={href} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, textDecoration: "none",
          }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{label}</span>
            <ChevronRight size={12} style={{ color: "#C0C0C0", marginLeft: "auto" }} />
          </Link>
        ))}
      </div>

      {/* Taluk complaint box */}
      <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
          Report a {subUnit} Issue (text only)
        </div>
        <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 12 }}>
          Submit civic problems for {talukData.name}. This updates the district {subUnit.toLowerCase()} complaint leaderboard.
        </div>
        <form onSubmit={onSubmitComplaint}>
          <textarea
            value={complaintText}
            onChange={(e) => {
              setComplaintText(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={`Describe the issue in ${talukData.name} ${subUnit}...`}
            maxLength={2000}
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: 10,
              border: "1px solid #DADAD5",
              padding: 10,
              fontSize: 13,
              outline: "none",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#9B9B9B" }}>{complaintText.trim().length}/2000</span>
            <button
              type="submit"
              disabled={submitComplaint.isPending}
              style={{
                border: "none",
                borderRadius: 8,
                background: submitComplaint.isPending ? "#9CA3AF" : "#111827",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 14px",
                cursor: submitComplaint.isPending ? "not-allowed" : "pointer",
              }}
            >
              {submitComplaint.isPending ? "Submitting..." : "Submit complaint"}
            </button>
          </div>
          {formError && <div style={{ marginTop: 10, fontSize: 12, color: "#B91C1C" }}>{formError}</div>}
          {submitComplaint.isSuccess && !formError && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#166534" }}>Complaint submitted successfully.</div>
          )}
        </form>
      </div>

      {/* District taluk leaderboard */}
      <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          District {subUnit} Complaint Leaderboard
        </div>
        {leaderboardQuery.isLoading && <div style={{ fontSize: 12, color: "#9B9B9B" }}>Loading leaderboard...</div>}
        {leaderboardQuery.isError && <div style={{ fontSize: 12, color: "#B91C1C" }}>Unable to load leaderboard.</div>}
        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && (
          <div style={{ display: "grid", gap: 8 }}>
            {(leaderboardQuery.data?.leaderboard ?? []).slice(0, 10).map((row, idx) => (
              <div
                key={row.talukSlug}
                style={{
                  border: `1px solid ${row.talukSlug === talukSlug ? "#111827" : "#E8E8E4"}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: row.talukSlug === talukSlug ? "#F9FAFB" : "#FFF",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6B7280" }}>#{idx + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{row.talukName}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#111827" }}>{row.complaints} complaints</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent taluk complaints */}
      <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Recent complaints in {talukData.name}
        </div>
        {complaintsQuery.isLoading && <div style={{ fontSize: 12, color: "#9B9B9B" }}>Loading complaints...</div>}
        {complaintsQuery.isError && <div style={{ fontSize: 12, color: "#B91C1C" }}>Unable to load complaints.</div>}
        {!complaintsQuery.isLoading && !complaintsQuery.isError && (
          <>
            <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 10 }}>
              Total complaints: <strong>{complaintsQuery.data?.totalComplaints ?? 0}</strong>
            </div>
            {(complaintsQuery.data?.complaints ?? []).length === 0 ? (
              <div style={{ fontSize: 12, color: "#9B9B9B" }}>No complaints yet for this {subUnit.toLowerCase()}.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {(complaintsQuery.data?.complaints ?? []).map((item) => (
                  <div key={item.id} style={{ border: "1px solid #E8E8E4", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, color: "#1A1A1A", marginBottom: 6, whiteSpace: "pre-wrap" }}>{item.message}</div>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>
                      {new Date(item.createdAt).toLocaleString("en-IN")} · {item.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Village list — only for districts where villages are meaningful */}
      {hasVillages && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            {villageLabel} in {talukData.name} ({effectiveVillageCount})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {villages.map((v) => (
              <Link
                key={v.id}
                href={`/${locale}/${state}/${district}/${talukSlug}/${v.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "#FFF", border: "1px solid #E8E8E4",
                  borderRadius: 10, textDecoration: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{v.name}</div>
                  {v.nameLocal && <div style={{ fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{v.nameLocal}</div>}
                  {v.population && <div style={{ fontSize: 11, color: "#9B9B9B" }}>{v.population.toLocaleString("en-IN")} pop</div>}
                </div>
                <ChevronRight size={13} style={{ color: "#C0C0C0" }} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
