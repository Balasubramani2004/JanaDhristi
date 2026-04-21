"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import RevenueSummary from "./RevenueSummary";
import ManualSupporterForm from "./ManualSupporterForm";
import SupportersTable, { type SupporterRow } from "./SupportersTable";

interface District {
  id: string;
  name: string;
  slug: string;
  stateId: string;
}
interface State {
  id: string;
  name: string;
  slug: string;
}

export default function SupportersSection({
  initialSupporters,
  districts,
  states,
}: {
  initialSupporters: SupporterRow[];
  districts: District[];
  states: State[];
}) {
  const [supporters, setSupporters] = useState<SupporterRow[]>(initialSupporters);
  const [editing, setEditing] = useState<SupporterRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(async () => {
    // Re-fetch supporters via admin API so the table reflects new additions / edits.
    try {
      const res = await fetch("/api/admin/supporters?limit=500");
      if (!res.ok) return;
      const json = await res.json();
      // Shape API returns doesn't have sponsoredDistrict joined; we preserve existing rows and
      // prepend/replace by id. For new manual supporters, we pull a fresh list.
      const fresh: SupporterRow[] = (json.supporters ?? []).map(mapApiToRow);
      setSupporters(fresh);
      setRefreshKey((k) => k + 1);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div>
      <RevenueSummary refreshKey={refreshKey} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 8 }}>
        <ManualSupporterForm districts={districts} states={states} onCreated={reload} />
      </div>
      <SupportersTable supporters={supporters} onEdit={setEditing} />
      {editing && (
        <EditSupporterModal
          supporter={editing}
          districts={districts}
          states={states}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setSupporters((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setRefreshKey((k) => k + 1);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function mapApiToRow(s: Record<string, unknown>): SupporterRow {
  return {
    id: String(s.id),
    name: String(s.name ?? ""),
    email: (s.email as string | null) ?? null,
    phone: (s.phone as string | null) ?? null,
    amount: Number(s.amount ?? 0),
    tier: String(s.tier ?? "custom"),
    status: String(s.status ?? "success"),
    method: (s.method as string | null) ?? null,
    isRecurring: Boolean(s.isRecurring),
    subscriptionStatus: (s.subscriptionStatus as string | null) ?? null,
    activatedAt: (s.activatedAt as string | null) ?? null,
    expiresAt: (s.expiresAt as string | null) ?? null,
    districtName: null,
    districtSlug: null,
    districtId: (s.districtId as string | null) ?? null,
    stateName: null,
    stateSlug: null,
    stateId: (s.stateId as string | null) ?? null,
    socialLink: (s.socialLink as string | null) ?? null,
    badgeLevel: (s.badgeLevel as string | null) ?? null,
    badgeType: (s.badgeType as string | null) ?? null,
    message: (s.message as string | null) ?? null,
    isPublic: s.isPublic === undefined ? true : Boolean(s.isPublic),
    source: String(s.source ?? "razorpay"),
    createdAt: String(s.createdAt ?? new Date().toISOString()),
  };
}

function EditSupporterModal({
  supporter,
  districts,
  states,
  onClose,
  onSaved,
}: {
  supporter: SupporterRow;
  districts: District[];
  states: State[];
  onClose: () => void;
  onSaved: (s: SupporterRow) => void;
}) {
  const [tier, setTier] = useState(supporter.tier);
  const [districtId, setDistrictId] = useState(supporter.districtId ?? "");
  const [stateId, setStateId] = useState(supporter.stateId ?? "");
  const [message, setMessage] = useState(supporter.message ?? "");
  const [isPublic, setIsPublic] = useState(supporter.isPublic);
  const [socialLink, setSocialLink] = useState(supporter.socialLink ?? "");
  const [expiresAt, setExpiresAt] = useState(
    supporter.expiresAt ? new Date(supporter.expiresAt).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide irrelevant location dropdowns based on tier
  const showState = tier === "state" || tier === "district" || tier === "custom" || tier === "chai" || tier === "monthly";
  const showDistrict = tier === "district" || tier === "custom" || tier === "chai" || tier === "monthly";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/supporters/${supporter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          districtId: districtId || null,
          stateId: stateId || null,
          message: message || null,
          isPublic,
          socialLink: socialLink.trim() || null,
          // empty input → null = permanent visibility
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      const updated: SupporterRow = {
        ...supporter,
        tier: json.supporter.tier,
        message: json.supporter.message,
        isPublic: json.supporter.isPublic,
        socialLink: json.supporter.socialLink ?? null,
        expiresAt: json.supporter.expiresAt ?? null,
        districtId: json.supporter.districtId ?? null,
        stateId: json.supporter.stateId ?? null,
        districtName:
          districts.find((d) => d.id === json.supporter.districtId)?.name ?? null,
        stateName: states.find((s) => s.id === json.supporter.stateId)?.name ?? null,
      };
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid #F0F0EC",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
              Edit supporter
            </h3>
            <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
              {supporter.name} · ₹{supporter.amount.toLocaleString("en-IN")}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#6B6B6B",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={save}
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>Tier</span>
            <select value={tier} onChange={(e) => setTier(e.target.value)} style={input}>
              {[
                "chai",
                "supporter",
                "district",
                "state",
                "patron",
                "custom",
                "founder",
                "monthly",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {showDistrict && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>District</span>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                style={input}
              >
                <option value="">None</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {showState && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>State</span>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                style={input}
              >
                <option value="">None</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!showDistrict && !showState && (
            <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "#6B6B6B", padding: "4px 0" }}>
              🇮🇳 National tier — visible everywhere, no state/district selection needed.
            </div>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>
              Visibility expires{" "}
              <span style={{ color: "#9B9B9B", fontWeight: 400 }}>(blank = permanent)</span>
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={input}
            />
            {expiresAt && new Date(expiresAt) < new Date() && (
              <span style={{ fontSize: 11, color: "#DC2626" }}>⚠ Date is in the past — supporter will be hidden.</span>
            )}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>Social link</span>
            <input
              type="text"
              placeholder="https://... or bare domain"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              style={input}
            />
          </label>
          <label
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ accentColor: "#2563EB" }}
            />
            Show on public Contributor Wall
          </label>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>Message</span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...input, resize: "vertical" }}
            />
          </label>

          {error && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#FEE2E2",
                color: "#991B1B",
                padding: 10,
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "7px 14px",
                background: "#fff",
                color: "#6B6B6B",
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "7px 14px",
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 13,
  background: "#FAFAF8",
};
