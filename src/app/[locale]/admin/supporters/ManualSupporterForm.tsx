"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, X } from "lucide-react";

// Suggested visibility expiry (days from today) by donation amount.
// These are SUGGESTIONS only — admin can override or leave blank for permanent.
function suggestedExpiryDays(amount: number): number | null {
  if (amount <= 0) return null;
  if (amount < 1000) return 90;     // ₹99-999  → 3 months
  if (amount < 10000) return 180;   // ₹1k-9,999 → 6 months
  return 365;                        // ₹10k+    → 12 months
}

function dateNDaysAhead(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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

interface Props {
  districts: District[];
  states: State[];
  onCreated: () => void;
}

const TIERS = [
  { value: "custom",   label: "One-Time Contribution (₹50+)",       amount: 50,    isRecurring: false },
  { value: "district", label: "District Champion (₹99/mo)",          amount: 99,    isRecurring: true  },
  { value: "state",    label: "State Champion (₹1,999/mo)",          amount: 1999,  isRecurring: true  },
  { value: "patron",   label: "All-India Patron (₹9,999/mo)",        amount: 9999,  isRecurring: true  },
  { value: "founder",  label: "Founding Builder (₹50,000/mo)",       amount: 50000, isRecurring: true  },
];

const METHODS = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export default function ManualSupporterForm({ districts, states, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState("custom");
  const [amount, setAmount] = useState<number>(50);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [stateId, setStateId] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setTier("custom");
    setAmount(50);
    setIsRecurring(false);
    setPaymentMethod("upi");
    setReferenceNumber("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setExpiresAt("");
    setDistrictId("");
    setStateId("");
    setSocialLink("");
    setMessage("");
    setIsPublic(true);
    setError(null);
  };

  const handleTierChange = (v: string) => {
    setTier(v);
    const preset = TIERS.find((t) => t.value === v);
    if (preset) {
      if (preset.amount > 0) setAmount(preset.amount);
      setIsRecurring(preset.isRecurring);
    }
    // Reset location dropdowns when switching to a tier that doesn't use them
    if (v === "patron" || v === "founder") {
      setDistrictId("");
      setStateId("");
    } else if (v === "state") {
      setDistrictId("");
    }
  };

  // Conditional rendering: which location dropdowns make sense for the tier
  const showState = useMemo(() => {
    return tier === "state" || tier === "district" || tier === "custom" || tier === "chai";
  }, [tier]);
  const showDistrict = useMemo(() => {
    return tier === "district" || tier === "custom" || tier === "chai";
  }, [tier]);
  // Patron / founder are NATIONAL — hide both dropdowns

  // Auto-suggest visibility expiry from amount when user hasn't typed one yet.
  useEffect(() => {
    if (expiresAt) return; // respect manual entry
    const days = suggestedExpiryDays(amount);
    if (days != null) setExpiresAt(dateNDaysAhead(days));
    // Intentionally NOT including expiresAt in deps — we only auto-fill once
    // per amount change, never overwriting a value the admin explicitly typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || amount <= 0) {
      setError("Name and amount are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/manual-supporter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          amount,
          tier,
          isRecurring,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || null,
          paymentDate: new Date(paymentDate).toISOString(),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          districtId: districtId || null,
          stateId: stateId || null,
          socialLink: socialLink.trim() || null,
          message: message.trim() || null,
          isPublic,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          background: "#2563EB",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <Plus size={14} /> Add Manual Supporter
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
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
              maxWidth: 640,
              maxHeight: "90vh",
              overflow: "auto",
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
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
                Add Manual Supporter
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
              onSubmit={submit}
              style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              <Field label="Name *">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Tier">
                <select value={tier} onChange={(e) => handleTierChange(e.target.value)} style={input}>
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (₹) *">
                <input
                  type="number"
                  min={1}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={input}
                />
              </Field>
              <Field label="Type" full>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A" }}>
                    <input
                      type="radio"
                      name="sub-type"
                      checked={!isRecurring}
                      onChange={() => setIsRecurring(false)}
                      style={{ accentColor: "#2563EB" }}
                    />
                    One-Time
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A" }}>
                    <input
                      type="radio"
                      name="sub-type"
                      checked={isRecurring}
                      onChange={() => setIsRecurring(true)}
                      style={{ accentColor: "#2563EB" }}
                    />
                    Monthly
                  </label>
                </div>
              </Field>
              <Field label="Expires on (optional)">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  placeholder={isRecurring ? "Leave blank for ongoing" : "Auto 30/60/90d"}
                  style={input}
                />
              </Field>
              <Field label="Payment method">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={input}
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reference number">
                <input
                  type="text"
                  placeholder="UPI ref / bank txn id"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Payment date">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={input}
                />
              </Field>
              {showDistrict && (
                <Field label="Sponsored district">
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
                </Field>
              )}
              {showState && (
                <Field label="Sponsored state">
                  <select value={stateId} onChange={(e) => setStateId(e.target.value)} style={input}>
                    <option value="">None</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {!showDistrict && !showState && (
                <Field label="Visibility scope" full>
                  <div style={{ fontSize: 11, color: "#6B6B6B", padding: "6px 0" }}>
                    🇮🇳 National — visible on every district + the homepage. No
                    state/district selection needed.
                  </div>
                </Field>
              )}
              <Field label="Social link" full>
                <input
                  type="url"
                  placeholder="https://..."
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Message" full>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ ...input, resize: "vertical" }}
                />
              </Field>
              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#1A1A1A",
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
                  onClick={() => setOpen(false)}
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
                    background: "#16A34A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save supporter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 13,
  background: "#FAFAF8",
};
