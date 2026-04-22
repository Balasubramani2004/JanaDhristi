/**
 * JanaDhristi — Civic Action Copilot (public)
 * POST /api/ai/civic-copilot
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAIJSON } from "@/lib/ai-provider";
import { predictKrishiDecisions } from "@/lib/krishi-fallback-model";
import { KRISHI_DATASET_MODEL_LABEL } from "@/lib/constants/krishi-copilot";

interface CopilotRequestBody {
  message?: string;
  state?: string;
  district?: string;
  locale?: "en" | "kn" | "hi";
}

interface CopilotPayload {
  summary: string;
  impactLevel: "low" | "medium" | "high";
  whoIsAffected: string[];
  personalizedAlerts: string[];
  predictions: Array<{
    metric: string;
    prediction: string;
    horizonDays: number;
    confidence: number;
  }>;
  decisionMode: {
    recommendation: string;
    rationale: string;
  };
  bestTimeToVisitOffice: string;
  immediateActions: string[];
  next24Hours: string[];
  complaintDraft: string;
  rtiDraft: string;
  confidence: number;
  caveats: string[];
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/** Merge LLM/partial JSON into a safe shape so the UI never crashes on missing keys. */
function normalizePayload(raw: unknown, message: string): CopilotPayload {
  const fb = fallbackPayload(message);
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Record<string, unknown>;

  const levelRaw = String(r.impactLevel ?? "").toLowerCase();
  const impactLevel: CopilotPayload["impactLevel"] =
    levelRaw === "low" || levelRaw === "medium" || levelRaw === "high" ? levelRaw : fb.impactLevel;

  let predictions = fb.predictions;
  if (Array.isArray(r.predictions)) {
    const mapped = r.predictions
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const o = p as Record<string, unknown>;
        const pred = String(o.prediction ?? "").trim();
        if (!pred) return null;
        const horizon = typeof o.horizonDays === "number" && Number.isFinite(o.horizonDays) ? Math.round(o.horizonDays) : 7;
        const conf = typeof o.confidence === "number" && Number.isFinite(o.confidence) ? Math.min(1, Math.max(0, o.confidence)) : 0.55;
        return {
          metric: String(o.metric ?? "Insight").trim() || "Insight",
          prediction: pred,
          horizonDays: Math.min(30, Math.max(1, horizon)),
          confidence: conf,
        };
      })
      .filter((x): x is CopilotPayload["predictions"][number] => Boolean(x));
    if (mapped.length > 0) predictions = mapped;
  }

  let decisionMode = fb.decisionMode;
  if (r.decisionMode && typeof r.decisionMode === "object" && !Array.isArray(r.decisionMode)) {
    const d = r.decisionMode as Record<string, unknown>;
    const rec = String(d.recommendation ?? "").trim();
    const rat = String(d.rationale ?? "").trim();
    if (rec || rat) {
      decisionMode = {
        recommendation: rec || fb.decisionMode.recommendation,
        rationale: rat || fb.decisionMode.rationale,
      };
    }
  }

  const conf =
    typeof r.confidence === "number" && Number.isFinite(r.confidence)
      ? Math.min(1, Math.max(0, r.confidence))
      : fb.confidence;

  return {
    summary: typeof r.summary === "string" && r.summary.trim() ? r.summary.trim() : fb.summary,
    impactLevel,
    whoIsAffected: asStringArray(r.whoIsAffected).length ? asStringArray(r.whoIsAffected) : fb.whoIsAffected,
    personalizedAlerts: asStringArray(r.personalizedAlerts).length ? asStringArray(r.personalizedAlerts) : fb.personalizedAlerts,
    predictions,
    decisionMode,
    bestTimeToVisitOffice:
      typeof r.bestTimeToVisitOffice === "string" && r.bestTimeToVisitOffice.trim()
        ? String(r.bestTimeToVisitOffice).trim()
        : fb.bestTimeToVisitOffice,
    immediateActions: asStringArray(r.immediateActions).length ? asStringArray(r.immediateActions) : fb.immediateActions,
    next24Hours: asStringArray(r.next24Hours).length ? asStringArray(r.next24Hours) : fb.next24Hours,
    complaintDraft:
      typeof r.complaintDraft === "string" && r.complaintDraft.trim() ? String(r.complaintDraft).trim() : fb.complaintDraft,
    rtiDraft: typeof r.rtiDraft === "string" && r.rtiDraft.trim() ? String(r.rtiDraft).trim() : fb.rtiDraft,
    confidence: conf,
    caveats: asStringArray(r.caveats).length ? asStringArray(r.caveats) : fb.caveats,
  };
}

function fallbackPayload(message: string): CopilotPayload {
  return {
    summary: "I could not run full AI analysis right now, but I can still give dataset-based farm guidance from available district signals.",
    impactLevel: "medium",
    whoIsAffected: ["Residents in the selected district", "Commuters", "Farmers and local households"],
    personalizedAlerts: [
      "Monitor local alerts every 4-6 hours today.",
      "Check active power/water updates before travel or irrigation decisions.",
    ],
    predictions: [
      { metric: "Water levels", prediction: "Watch for a gradual decline if no rainfall arrives this week.", horizonDays: 5, confidence: 0.56 },
      { metric: "Crop prices", prediction: "Short-term price fluctuations are likely; verify mandi updates before selling.", horizonDays: 7, confidence: 0.52 },
      { metric: "Harvest timing", prediction: "Harvest in batches and avoid peak-heat hours until next weather update confirms stability.", horizonDays: 2, confidence: 0.54 },
    ],
    decisionMode: {
      recommendation: "Use a split decision: act partially today and re-check official updates tomorrow.",
      rationale: "When confidence is moderate, split decisions reduce risk while staying responsive to new data.",
    },
    bestTimeToVisitOffice: "Weekdays between 11:00 AM and 1:00 PM are usually more reliable than peak opening/closing hours.",
    immediateActions: [
      "Check active local alerts and utility updates in your district dashboard.",
      "Capture evidence (photo/time/location) before filing a complaint.",
      "Use official district office contact details for escalation.",
    ],
    next24Hours: [
      "Track weather, water, power and alerts modules for fresh updates.",
      "If issue persists, file RTI for status/records and expected resolution time.",
    ],
    complaintDraft: `Subject: Farm-linked civic issue in district\n\nRespected Officer,\n\nI am writing to report the following issue affecting farming activity: ${message}.\n\nKindly acknowledge this complaint and share the expected resolution timeline.\n\nThank you.`,
    rtiDraft: `Subject: RTI Application under Section 6(1) - Farm support status\n\nPlease provide certified information regarding: ${message}\n1) Current status and action taken\n2) Responsible department/officer\n3) Timeline for resolution\n4) Copies of relevant orders/circulars\n\nApplicant details:\nName:\nAddress:\nDate:`,
    confidence: 0.62,
    caveats: ["Generated fallback response due to temporary AI or data limitations."],
  };
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

function localCivicModel(params: {
  message: string;
  districtName: string;
  weather: { rainfall?: number | null; conditions?: string | null } | null;
  dams: Array<{ storagePct: number; damName: string }>;
  outages: Array<{ area: string; type: string; reason?: string | null }>;
  alerts: Array<{ title: string; severity: string }>;
  crops: Array<{ commodity: string; modalPrice: number; date: Date }>;
  advisoryCount7d: number;
  trainedDecision?: {
    modelName: string;
    harvest: { label: "harvest_now" | "harvest_wait"; confidence: number };
    sell: { label: "sell_now" | "sell_wait"; confidence: number };
  } | null;
}): CopilotPayload {
  const { message, districtName, weather, dams, outages, alerts, crops, advisoryCount7d, trainedDecision } = params;

  const avgStorage = dams.length ? dams.reduce((s, d) => s + d.storagePct, 0) / dams.length : null;
  const activeOutages = outages.length;
  const severeAlerts = alerts.filter((a) => {
    const sev = (a.severity ?? "info").toLowerCase();
    return sev === "high" || sev === "critical";
  }).length;
  const likelyRain = (weather?.rainfall ?? 0) > 1;

  const cropByCommodity = new Map<string, number[]>();
  for (const c of crops) {
    const arr = cropByCommodity.get(c.commodity) ?? [];
    arr.push(c.modalPrice);
    cropByCommodity.set(c.commodity, arr);
  }
  const cropSignal = Array.from(cropByCommodity.entries())
    .map(([commodity, prices]) => {
      if (prices.length < 2) return null;
      const latest = prices[0];
      const med = median(prices) ?? latest;
      const deltaPct = med > 0 ? ((latest - med) / med) * 100 : 0;
      return { commodity, latest, deltaPct };
    })
    .filter((x): x is { commodity: string; latest: number; deltaPct: number } => Boolean(x))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))[0];
  const msgLower = message.toLowerCase();
  const harvestIntent = /(harvest|ಕೊಯ್ಲು|कटाई)/i.test(msgLower);
  const sellIntent = /(sell|ಮಾರಾಟ|बेचना)/i.test(msgLower);
  const mentionedCrop = crops.find((c) => msgLower.includes(c.commodity.toLowerCase()));
  const candidateCrop = mentionedCrop?.commodity ?? cropSignal?.commodity ?? crops[0]?.commodity ?? "the selected crop";

  const impactLevel: "low" | "medium" | "high" =
    severeAlerts > 0 || activeOutages >= 4 || (avgStorage != null && avgStorage < 30) ? "high" :
      activeOutages >= 2 || (avgStorage != null && avgStorage < 45) ? "medium" : "low";

  const personalizedAlerts = [
    severeAlerts > 0
      ? `${severeAlerts} high-severity alert(s) are active in ${districtName}.`
      : "No high-severity local alert detected right now.",
    activeOutages > 0
      ? `${activeOutages} active power outage report(s) detected — plan charging/water pumping accordingly.`
      : "No active power outage reports found in latest district data.",
    avgStorage != null
      ? `Current dam storage average is ${avgStorage.toFixed(1)}%.`
      : "Dam storage readings are limited; verify with official bulletin.",
    `Agri advisory updates in last 7 days: ${advisoryCount7d}.`,
  ];

  const predictions = [
    {
      metric: "Water levels",
      prediction:
        avgStorage == null
          ? "Insufficient recent readings to forecast confidently."
          : !likelyRain && avgStorage < 45
            ? "Water levels may remain under pressure over the next 5 days if rainfall stays low."
            : "Water storage appears relatively stable for the next 5 days unless demand spikes.",
      horizonDays: 5,
      confidence: avgStorage == null ? 0.45 : 0.68,
    },
    {
      metric: "Crop prices",
      prediction:
        cropSignal == null
          ? "Not enough market points to forecast a specific commodity trend this week."
          : cropSignal.deltaPct > 4
            ? `${cropSignal.commodity} shows upward pressure; prices could cool after short-term spike.`
            : cropSignal.deltaPct < -4
              ? `${cropSignal.commodity} is below median trend; near-term recovery is possible if arrivals fall.`
              : `${cropSignal.commodity} appears range-bound this week with mild movement.`,
      horizonDays: 7,
      confidence: cropSignal == null ? 0.44 : 0.63,
    },
    {
      metric: `Harvest timing (${candidateCrop})`,
      prediction:
        harvestIntent
          ? likelyRain
            ? `Rain signal is present. If ${candidateCrop} is mature and quality-sensitive, prefer early-day harvest with quick post-harvest drying and storage.`
            : `No strong rain signal right now. Tomorrow can be suitable for harvesting ${candidateCrop} if crop maturity is reached and labour/logistics are ready.`
          : `For ${candidateCrop}, combine weather + mandi trend + storage readiness before deciding harvest timing.`,
      horizonDays: 2,
      confidence: likelyRain ? 0.62 : 0.67,
    },
  ];

  const decisionMode = {
    recommendation:
      sellIntent || /tomato|crop|price|ಬೆಲೆ|भाव/i.test(message)
        ? trainedDecision?.sell.label === "sell_now"
          ? `Trained model signal says SELL NOW (confidence ${(trainedDecision.sell.confidence * 100).toFixed(0)}%). Consider partial selling today if mandi rates are favorable.`
          : `Trained model signal says WAIT before selling (confidence ${((trainedDecision?.sell.confidence ?? 0.5) * 100).toFixed(0)}%). Re-check mandi trend in 24-48 hours.`
        : harvestIntent
          ? trainedDecision?.harvest.label === "harvest_now"
            ? `Trained model suggests HARVEST NOW for ${candidateCrop} (confidence ${(trainedDecision.harvest.confidence * 100).toFixed(0)}%), preferably in batches with post-harvest protection.`
            : `Trained model suggests WAIT for harvesting ${candidateCrop} (confidence ${((trainedDecision?.harvest.confidence ?? 0.5) * 100).toFixed(0)}%), and re-check weather and moisture conditions tomorrow.`
        : /office|visit|government|certificate|service/i.test(message)
          ? "Visit mid-day on a working day and carry all documents plus one photocopy set."
          : "Prioritize urgent complaints today and schedule non-urgent follow-up after fresh morning updates.",
    rationale:
      "This recommendation uses current district alerts, outages, and short-term trend signals with moderate confidence.",
  };

  const summary = [
    `${districtName} civic snapshot indicates ${impactLevel.toUpperCase()} attention level.`,
    activeOutages > 0 ? `${activeOutages} active outage reports need monitoring.` : "No immediate outage surge detected.",
    avgStorage != null ? `Average dam storage is ${avgStorage.toFixed(1)}%.` : "Dam trend confidence is limited.",
  ].join(" ");

  return {
    summary,
    impactLevel,
    whoIsAffected: [
      "Local households relying on public utilities",
      "Farmers and market-linked sellers",
      "Commuters and people visiting public offices",
    ],
    personalizedAlerts,
    predictions,
    decisionMode,
    bestTimeToVisitOffice: "Best window: 11:00 AM to 1:00 PM on weekdays (avoid opening hour rush).",
    immediateActions: [
      "Check district alerts and utility status before planning travel/work.",
      "Collect evidence (photo, location, time) if filing a complaint.",
      "Use the relevant department office contact for faster routing.",
    ],
    next24Hours: [
      "Review fresh weather/water/power updates in the morning and evening.",
      "Escalate unresolved high-severity issues with ticket references.",
    ],
    complaintDraft: `Subject: Urgent civic issue report — ${districtName}\n\nRespected Officer,\n\nI wish to report the following issue: ${message}.\n\nLocation:\nDate/Time observed:\nImpact on residents:\n\nPlease acknowledge this complaint and share the action timeline.\n\nRegards,`,
    rtiDraft: `Subject: RTI Application under Section 6(1) — Request for records\n\nKindly provide certified information for: ${message}\n\n1) Current status and action taken\n2) Officer/department responsible\n3) Timeline for resolution\n4) Copies of relevant circulars/orders/inspection notes\n\nApplicant details:\nName:\nAddress:\nDate:`,
    confidence: 0.64,
    caveats: [
      "Local civic model fallback used; verify critical actions with official notifications.",
      "Predictions are directional, not guarantees.",
      trainedDecision
        ? `Trained fallback model (${trainedDecision.modelName}) contributed to harvest/sell suggestion.`
        : "Trained fallback model not found; rules-only mode applied.",
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CopilotRequestBody;
    const message = String(body.message ?? "").trim();
    const stateSlug = String(body.state ?? "").trim();
    const districtSlug = String(body.district ?? "").trim();
    const locale = body.locale === "kn" || body.locale === "hi" ? body.locale : "en";

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (!stateSlug || !districtSlug) {
      return NextResponse.json({ error: "state and district are required" }, { status: 400 });
    }

    const state = await prisma.state.findFirst({
      where: { slug: stateSlug },
      select: { id: true, name: true },
    });
    if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

    const district = await prisma.district.findFirst({
      where: { slug: districtSlug, stateId: state.id },
      select: { id: true, name: true, nameLocal: true },
    });
    if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

    const [weather, dams, outages, alerts, news, crops, advisories, offices, rtiTemplates] = await Promise.all([
      prisma.weatherReading.findFirst({
        where: { districtId: district.id },
        orderBy: { recordedAt: "desc" },
        select: {
          recordedAt: true, temperature: true, humidity: true, rainfall: true,
          conditions: true, source: true,
        },
      }),
      prisma.damReading.findMany({
        where: { districtId: district.id },
        orderBy: { recordedAt: "desc" },
        take: 5,
        select: { damName: true, storagePct: true, recordedAt: true, source: true },
      }),
      prisma.powerOutage.findMany({
        where: { districtId: district.id, active: true },
        orderBy: { startTime: "desc" },
        take: 5,
        select: { area: true, type: true, reason: true, startTime: true, source: true },
      }),
      prisma.localAlert.findMany({
        where: { districtId: district.id, active: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { title: true, description: true, severity: true, sourceUrl: true, updatedAt: true },
      }),
      prisma.newsItem.findMany({
        where: { districtId: district.id },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: { title: true, summary: true, category: true, publishedAt: true, source: true, url: true },
      }),
      prisma.cropPrice.findMany({
        where: { districtId: district.id },
        orderBy: [{ date: "desc" }, { commodity: "asc" }],
        take: 20,
        select: { commodity: true, modalPrice: true, market: true, date: true, source: true },
      }),
      prisma.agriAdvisory.findMany({
        where: {
          districtId: district.id,
          weekOf: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
        },
        take: 50,
        select: { id: true },
      }),
      prisma.govOffice.findMany({
        where: { districtId: district.id, active: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { name: true, department: true, phone: true, email: true, address: true },
      }),
      prisma.rtiTemplate.findMany({
        where: { active: true, OR: [{ districtId: district.id }, { districtId: null }] },
        take: 2,
        select: { topic: true, department: true, pioAddress: true, feeAmount: true, templateText: true },
      }),
    ]);

    const sources = unique(
      [
        weather?.source,
        ...dams.map((x) => x.source),
        ...outages.map((x) => x.source),
        ...news.map((x) => x.url || x.source),
        ...crops.map((x) => x.source),
        ...alerts.map((x) => x.sourceUrl || undefined),
      ].filter((x): x is string => Boolean(x))
    ).slice(0, 10);

    const context = {
      district: district.name,
      state: state.name,
      locale,
      weather,
      dams,
      outages,
      alerts,
      crops,
      advisoriesCount7d: advisories.length,
      news,
      offices,
      rtiTemplates,
      sources,
      userQuestion: message,
      generatedAt: new Date().toISOString(),
    };

    const systemPrompt = [
      "You are JanaDhristi Krishi Intelligence Copilot.",
      "Position yourself as a district agri assistant trained on historical and live district datasets.",
      "Give practical, safe, farmer-first guidance using ONLY provided context.",
      "Never invent facts, agencies, numbers, or URLs.",
      "If uncertain, clearly say what is unknown in caveats.",
      "Return valid JSON only with keys:",
      "{summary, impactLevel, whoIsAffected, personalizedAlerts, predictions, decisionMode, bestTimeToVisitOffice, immediateActions, next24Hours, complaintDraft, rtiDraft, confidence, caveats}",
      "impactLevel must be one of: low, medium, high.",
      "confidence must be a number from 0 to 1.",
      "predictions must include horizonDays and confidence for each metric.",
      "decisionMode should directly answer user's decision question if present (e.g., harvest/sell/irrigate tomorrow).",
      "bestTimeToVisitOffice should be practical and short.",
      "Keep language plain, concise, and actionable for farmers and rural households.",
    ].join(" ");

    const language = locale === "kn" ? "Kannada" : locale === "hi" ? "Hindi" : "English";
    const userPrompt = `Context JSON:\n${JSON.stringify(context)}\n\nGenerate response in ${language}.`;

    let payload: CopilotPayload;
    let aiMeta: { provider?: string; model?: string; usedFallback?: boolean } = {};

    try {
      const ai = await callAIJSON<CopilotPayload>({
        purpose: "civic-assistant",
        district: districtSlug,
        systemPrompt,
        userPrompt,
        maxTokens: 1500,
        temperature: 0.25,
      });
      payload = ai.data;
      aiMeta = { provider: ai.provider, model: ai.model, usedFallback: ai.usedFallback };
    } catch {
      const latestCrop = crops[0];
      const cropMedian = median(crops.map((c) => c.modalPrice)) ?? latestCrop?.modalPrice ?? 0;
      const priceDeltaPct =
        cropMedian > 0 && latestCrop ? ((latestCrop.modalPrice - cropMedian) / cropMedian) * 100 : 0;
      const damStoragePct = dams.length ? dams.reduce((s, d) => s + d.storagePct, 0) / dams.length : 0;
      const trainedDecision = await predictKrishiDecisions({
        priceDeltaPct,
        rainfallMm: weather?.rainfall ?? 0,
        damStoragePct,
        activeOutages: outages.length,
        advisoryCount7d: advisories.length,
      });

      payload = localCivicModel({
        message,
        districtName: district.name,
        weather,
        dams: dams.map((d) => ({ storagePct: d.storagePct, damName: d.damName })),
        outages,
        alerts: alerts.map((a) => ({ title: a.title, severity: a.severity })),
        crops,
        advisoryCount7d: advisories.length,
        trainedDecision,
      });
      aiMeta = {
        provider: "local-civic-model",
        model: KRISHI_DATASET_MODEL_LABEL,
        usedFallback: true,
      };
    }

    if (!payload || !payload.summary) {
      payload = fallbackPayload(message);
      aiMeta = {
        provider: "local-civic-model",
        model: KRISHI_DATASET_MODEL_LABEL,
        usedFallback: true,
      };
    }

    payload = normalizePayload(payload, message);

    return NextResponse.json({
      district: { slug: districtSlug, name: district.name, state: state.name },
      ...payload,
      sources,
      ai: aiMeta,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[civic-copilot] error:", error);
    return NextResponse.json({ error: "Failed to generate civic guidance" }, { status: 500 });
  }
}
