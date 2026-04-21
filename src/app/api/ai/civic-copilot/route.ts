/**
 * JanaDhristi — Civic Action Copilot (public)
 * POST /api/ai/civic-copilot
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAIJSON } from "@/lib/ai-provider";

interface CopilotRequestBody {
  message?: string;
  state?: string;
  district?: string;
  locale?: "en" | "kn";
}

interface CopilotPayload {
  summary: string;
  impactLevel: "low" | "medium" | "high";
  whoIsAffected: string[];
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

function fallbackPayload(message: string): CopilotPayload {
  return {
    summary: "I could not run full analysis right now, but I can still guide next steps based on available district data.",
    impactLevel: "medium",
    whoIsAffected: ["Residents in the selected district", "Commuters", "Farmers and local households"],
    immediateActions: [
      "Check active local alerts and utility updates in your district dashboard.",
      "Capture evidence (photo/time/location) before filing a complaint.",
      "Use official district office contact details for escalation.",
    ],
    next24Hours: [
      "Track weather, water, power and alerts modules for fresh updates.",
      "If issue persists, file RTI for status/records and expected resolution time.",
    ],
    complaintDraft: `Subject: Urgent civic issue in district\n\nRespected Officer,\n\nI am writing to report the following issue in my area: ${message}.\n\nKindly acknowledge this complaint and share the expected resolution timeline.\n\nThank you.`,
    rtiDraft: `Subject: RTI Application under Section 6(1) — Civic service status\n\nPlease provide certified information regarding: ${message}\n1) Current status and action taken\n2) Responsible department/officer\n3) Timeline for resolution\n4) Copies of relevant orders/circulars\n\nApplicant details:\nName:\nAddress:\nDate:`,
    confidence: 0.62,
    caveats: ["Generated fallback response due to temporary AI or data limitations."],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CopilotRequestBody;
    const message = String(body.message ?? "").trim();
    const stateSlug = String(body.state ?? "").trim();
    const districtSlug = String(body.district ?? "").trim();
    const locale = body.locale === "kn" ? "kn" : "en";

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

    const [weather, dams, outages, alerts, news, crops, offices, rtiTemplates] = await Promise.all([
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
      news,
      offices,
      rtiTemplates,
      sources,
      userQuestion: message,
      generatedAt: new Date().toISOString(),
    };

    const systemPrompt = [
      "You are JanaDhristi Civic Action Copilot.",
      "Give practical, safe, citizen-first guidance using ONLY provided context.",
      "Never invent facts, agencies, numbers, or URLs.",
      "If uncertain, clearly say what is unknown in caveats.",
      "Return valid JSON only with keys:",
      "{summary, impactLevel, whoIsAffected, immediateActions, next24Hours, complaintDraft, rtiDraft, confidence, caveats}",
      "impactLevel must be one of: low, medium, high.",
      "confidence must be a number from 0 to 1.",
      "Keep language plain, concise, and actionable for common people.",
    ].join(" ");

    const userPrompt = `Context JSON:\n${JSON.stringify(context)}\n\nGenerate response in ${locale === "kn" ? "Kannada" : "English"}.`;

    let payload: CopilotPayload;
    let aiMeta: { provider?: string; model?: string; usedFallback?: boolean } = {};

    try {
      const ai = await callAIJSON<CopilotPayload>({
        purpose: "insight",
        district: district.slug,
        systemPrompt,
        userPrompt,
        maxTokens: 1200,
        temperature: 0.25,
      });
      payload = ai.data;
      aiMeta = { provider: ai.provider, model: ai.model, usedFallback: ai.usedFallback };
    } catch {
      payload = fallbackPayload(message);
    }

    if (!payload || !payload.summary) {
      payload = fallbackPayload(message);
    }

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
