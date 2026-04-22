"use client";

import { useState } from "react";
import { Bot, Loader2, Mic, Sparkles, Volume2, X } from "lucide-react";
import { KRISHI_DATASET_MODEL_LABEL } from "@/lib/constants/krishi-copilot";

interface Props {
  locale: string;
  stateSlug?: string;
  districtSlug?: string;
}

interface CopilotResponse {
  summary: string;
  impactLevel: "low" | "medium" | "high";
  whoIsAffected: string[];
  personalizedAlerts: string[];
  predictions?: Array<{
    metric: string;
    prediction: string;
    horizonDays: number;
    confidence: number;
  }>;
  decisionMode?: {
    recommendation: string;
    rationale: string;
  };
  bestTimeToVisitOffice?: string;
  immediateActions: string[];
  next24Hours: string[];
  complaintDraft: string;
  rtiDraft: string;
  confidence: number;
  caveats: string[];
  sources?: string[];
  ai?: { provider?: string; model?: string; usedFallback?: boolean };
}

/** Strip API envelope fields and ensure arrays/strings exist so render never throws. */
function sanitizeCopilotResponse(data: Record<string, unknown>): CopilotResponse {
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
  const levelRaw = String(data.impactLevel ?? "medium").toLowerCase();
  const impactLevel: CopilotResponse["impactLevel"] =
    levelRaw === "low" || levelRaw === "high" ? levelRaw : "medium";

  const predictions = Array.isArray(data.predictions)
    ? (data.predictions as unknown[])
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const o = p as Record<string, unknown>;
          const prediction = String(o.prediction ?? "").trim();
          if (!prediction) return null;
          return {
            metric: String(o.metric ?? "Insight").trim() || "Insight",
            prediction,
            horizonDays:
              typeof o.horizonDays === "number" && Number.isFinite(o.horizonDays)
                ? Math.min(30, Math.max(1, Math.round(o.horizonDays)))
                : 7,
            confidence:
              typeof o.confidence === "number" && Number.isFinite(o.confidence)
                ? Math.min(1, Math.max(0, o.confidence))
                : 0.55,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
    : [];

  const dm = data.decisionMode && typeof data.decisionMode === "object" && !Array.isArray(data.decisionMode)
    ? (data.decisionMode as Record<string, unknown>)
    : null;

  return {
    summary: typeof data.summary === "string" ? data.summary : "",
    impactLevel,
    whoIsAffected: strArr(data.whoIsAffected).length ? strArr(data.whoIsAffected) : ["Residents in this district"],
    personalizedAlerts: strArr(data.personalizedAlerts).length
      ? strArr(data.personalizedAlerts)
      : ["Review district alerts and official updates today."],
    predictions: predictions.length ? predictions : undefined,
    decisionMode:
      dm && (String(dm.recommendation ?? "").trim() || String(dm.rationale ?? "").trim())
        ? {
            recommendation: String(dm.recommendation ?? "").trim() || "See district modules for next steps.",
            rationale: String(dm.rationale ?? "").trim() || "Based on available civic context.",
          }
        : undefined,
    bestTimeToVisitOffice:
      typeof data.bestTimeToVisitOffice === "string" && data.bestTimeToVisitOffice.trim()
        ? data.bestTimeToVisitOffice.trim()
        : undefined,
    immediateActions: strArr(data.immediateActions).length ? strArr(data.immediateActions) : ["Check official district sources."],
    next24Hours: strArr(data.next24Hours).length ? strArr(data.next24Hours) : ["Recheck weather, water, and news tomorrow."],
    complaintDraft: typeof data.complaintDraft === "string" ? data.complaintDraft : "",
    rtiDraft: typeof data.rtiDraft === "string" ? data.rtiDraft : "",
    confidence:
      typeof data.confidence === "number" && Number.isFinite(data.confidence)
        ? Math.min(1, Math.max(0, data.confidence))
        : 0.6,
    caveats: strArr(data.caveats).length ? strArr(data.caveats) : [],
    sources: strArr(data.sources).length ? strArr(data.sources) : undefined,
    ai:
      data.ai && typeof data.ai === "object"
        ? (data.ai as CopilotResponse["ai"])
        : undefined,
  };
}

const QUICK_PROMPTS = [
  "Is tomorrow good to harvest tomato in this district?",
  "Should I sell tomato today or wait 2 days?",
  "Will rainfall affect irrigation decisions this week?",
  "Give a farmer action plan for next 24 hours",
];

export default function CivicAgentButton({ locale, stateSlug, districtSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

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
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error((data?.error as string) ?? "Failed to generate response");
      }
      setResult(sanitizeCopilotResponse(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const disabled = !stateSlug || !districtSlug;

  function startVoiceInput() {
    if (disabled || loading) return;
    const W = window as Window & {
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = locale === "kn" ? "kn-IN" : locale === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.onresult = (event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      setPrompt(text);
      if (text.trim()) void run(text);
    };
    recognition.onerror = () => setError("Voice recognition failed. Please try again.");
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function speakSummary() {
    if (!result?.summary || typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(
      [result.summary, ...(result.immediateActions ?? []).slice(0, 2)].join(". ")
    );
    utter.lang = locale === "kn" ? "kn-IN" : locale === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={disabled ? "Open a district page to use Krishi Copilot" : "Open Krishi Copilot"}
        aria-label="Open Krishi Copilot"
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
            aria-label="Krishi Action Copilot"
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
                <strong style={{ fontSize: 14, color: "#1A1A1A" }}>JanaDhristi Krishi Copilot</strong>
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
                Ask crop, weather, rainfall, dam and mandi questions. This assistant gives dataset-driven farm guidance and practical next actions.
              </p>
            ) : (
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#D97706" }}>
                Open a district page to use district-specific farm guidance.
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask: Is tomorrow good to harvest tomato?"
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
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Analyze"}
              </button>
              <button
                onClick={startVoiceInput}
                disabled={disabled || loading || listening}
                title="Voice input (farmer query)"
                aria-label="Voice input"
                style={{
                  border: "1px solid #E8E8E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  background: listening ? "#FEE2E2" : "#FAFAF8",
                  color: listening ? "#DC2626" : "#6B6B6B",
                  cursor: "pointer",
                }}
              >
                <Mic size={14} />
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
                  Impact:{" "}
                  <strong style={{ color: "#1A1A1A" }}>
                    {(result.impactLevel ?? "medium").toString().toUpperCase()}
                  </strong>{" "}
                  · Confidence:{" "}
                  <strong style={{ color: "#1A1A1A" }}>{Math.round((result.confidence ?? 0) * 100)}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>
                    Model: {KRISHI_DATASET_MODEL_LABEL}
                  </div>
                  <button
                    onClick={speakSummary}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      border: "1px solid #E8E8E4",
                      borderRadius: 8,
                      padding: "4px 8px",
                      background: "#FAFAF8",
                      color: "#4B4B4B",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    <Volume2 size={12} />
                    Speak
                  </button>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#1A1A1A", lineHeight: 1.5 }}>{result.summary}</p>

                <Section title="Who is affected" items={result.whoIsAffected} />
                <Section title="What to watch today" items={result.personalizedAlerts} />
                {result.bestTimeToVisitOffice && <Block title="Best time for office/market visits" text={result.bestTimeToVisitOffice} />}
                {result.decisionMode && (
                  <Block
                    title="Farm Decision Mode"
                    text={`${result.decisionMode.recommendation}\n\nWhy: ${result.decisionMode.rationale}`}
                  />
                )}
                {result.predictions && result.predictions.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 }}>
                      Predictive Insights
                    </div>
                    {result.predictions.map((p) => (
                      <div
                        key={`${p.metric}-${p.horizonDays}`}
                        style={{
                          background: "#F9FAFB",
                          border: "1px solid #E8E8E4",
                          borderRadius: 8,
                          padding: "8px 10px",
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>
                          {p.metric} · {p.horizonDays}d horizon
                        </div>
                        <div style={{ fontSize: 12, color: "#4B4B4B", marginTop: 2 }}>{p.prediction}</div>
                        <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
                          Confidence: {Math.round((p.confidence ?? 0) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
