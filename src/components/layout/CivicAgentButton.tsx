"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles, X } from "lucide-react";

interface Props {
  locale: string;
  stateSlug?: string;
  districtSlug?: string;
}

interface CopilotResponse {
  summary: string;
  impactLevel: "low" | "medium" | "high";
  whoIsAffected: string[];
  immediateActions: string[];
  next24Hours: string[];
  complaintDraft: string;
  rtiDraft: string;
  confidence: number;
  caveats: string[];
  sources?: string[];
}

const QUICK_PROMPTS = [
  "What changed in my district right now?",
  "What should people do in the next 10 minutes?",
  "Generate a complaint draft for current issues",
  "Generate an RTI draft for this issue",
];

export default function CivicAgentButton({ locale, stateSlug, districtSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(query: string) {
    if (!query.trim() || !stateSlug || !districtSlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/civic-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query.trim(),
          state: stateSlug,
          district: districtSlug,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate response");
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const disabled = !stateSlug || !districtSlug;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={disabled ? "Open a district page to use Civic Copilot" : "Open Civic Copilot"}
        aria-label="Open Civic Copilot"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid #E8E8E4",
          background: "#FAFAF8",
          color: disabled ? "#B3B3AD" : "#7C3AED",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Bot size={16} />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 90 }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Civic Action Copilot"
            style={{
              position: "fixed",
              right: 16,
              top: 72,
              width: "min(560px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 90px)",
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 14,
              zIndex: 91,
              boxShadow: "0 16px 50px rgba(0,0,0,0.2)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={15} style={{ color: "#7C3AED" }} />
                <strong style={{ fontSize: 14, color: "#1A1A1A" }}>Civic Action Copilot</strong>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ border: "none", background: "transparent", color: "#6B6B6B", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            {!disabled ? (
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6B6B6B" }}>
                Ask for real-time impact and get immediate actions, complaint draft, RTI draft, and cited sources.
              </p>
            ) : (
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#D97706" }}>
                Open a district page to use district-specific AI guidance.
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask: What should citizens do today?"
                disabled={disabled || loading}
                style={{
                  flex: 1,
                  border: "1px solid #E8E8E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={() => run(prompt)}
                disabled={disabled || loading || !prompt.trim()}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  background: disabled || loading || !prompt.trim() ? "#E8E8E4" : "#7C3AED",
                  color: disabled || loading || !prompt.trim() ? "#9B9B9B" : "#fff",
                  cursor: "pointer",
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Ask"}
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setPrompt(q); void run(q); }}
                  disabled={disabled || loading}
                  style={{
                    border: "1px solid #E8E8E4",
                    background: "#FAFAF8",
                    color: "#4B4B4B",
                    borderRadius: 999,
                    fontSize: 11,
                    padding: "5px 9px",
                    cursor: "pointer",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {error && <p style={{ marginTop: 10, fontSize: 12, color: "#DC2626" }}>{error}</p>}

            {result && (
              <div style={{ marginTop: 12, border: "1px solid #E8E8E4", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 6 }}>
                  Impact: <strong style={{ color: "#1A1A1A" }}>{result.impactLevel.toUpperCase()}</strong> · Confidence:{" "}
                  <strong style={{ color: "#1A1A1A" }}>{Math.round((result.confidence ?? 0) * 100)}%</strong>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#1A1A1A", lineHeight: 1.5 }}>{result.summary}</p>

                <Section title="Who is affected" items={result.whoIsAffected} />
                <Section title="Immediate actions" items={result.immediateActions} />
                <Section title="Next 24 hours" items={result.next24Hours} />

                <Block title="Complaint Draft" text={result.complaintDraft} />
                <Block title="RTI Draft" text={result.rtiDraft} />

                {result.sources && result.sources.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 }}>Sources</div>
                    {result.sources.map((s) => (
                      <div key={s} style={{ fontSize: 11, color: "#2563EB", overflowWrap: "anywhere" }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 }}>{title}</div>
      {items.slice(0, 6).map((item) => (
        <div key={`${title}-${item}`} style={{ fontSize: 12, color: "#1A1A1A", marginBottom: 3 }}>
          • {item}
        </div>
      ))}
    </div>
  );
}

function Block({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 }}>{title}</div>
      <div
        style={{
          background: "#F9FAFB",
          border: "1px solid #E8E8E4",
          borderRadius: 8,
          padding: 8,
          fontSize: 12,
          color: "#1A1A1A",
          whiteSpace: "pre-wrap",
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
    </div>
  );
}
