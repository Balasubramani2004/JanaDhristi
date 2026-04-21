/**
 * ForThePeople.in — AI Feedback Classifier
 * Classifies user feedback with legal guardrails.
 * Uses callAI() with purpose 'classify' (routes to free model).
 * Falls back to rule-based classification if AI fails.
 */

import { callAI } from "@/lib/ai-provider";
import { prisma } from "@/lib/db";

export interface FeedbackClassification {
  category: "bug" | "feature" | "data_error" | "praise" | "general" | "partnership";
  priority: "critical" | "high" | "medium" | "low";
  summary: string;
  confidence: number;
  flags: string[];
  adminWarning: string | null;
}

/** Robust JSON extractor — handles markdown fences, preamble text, etc. */
function extractJSON(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* continue */ }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }
  throw new Error(`Could not parse JSON: ${text.slice(0, 200)}`);
}

// Short, simple prompt that free models can handle reliably
const SYSTEM_PROMPT = `Classify user feedback as JSON. Respond with ONLY this JSON format, nothing else:
{"category":"bug|feature|data_error|praise|general|partnership","priority":"critical|high|medium|low","summary":"one line max 80 chars","confidence":0.8,"flags":[],"adminWarning":null}

Rules:
- category: bug=broken UI, data_error=wrong data, feature=new request, praise=compliment, partnership=volunteer offer, general=other
- priority: critical=wrong data or site broken, high=missing data or popular request, medium=nice-to-have, low=vague or praise
- flags: add "data_verification_needed" if reports wrong data, "partnership_opportunity" if offers help, "legal_risk" if mentions defamation/govt logos/personal data
- adminWarning: null unless there's a legal/content risk, then a short warning string`;

/** Rule-based fallback when AI fails */
function fallbackClassify(type: string, subject: string, message: string): FeedbackClassification {
  const text = `${subject} ${message}`.toLowerCase();

  let category: FeedbackClassification["category"] = "general";
  if (type === "bug") category = "bug";
  else if (type === "wrong_data") category = "data_error";
  else if (type === "suggestion") category = "feature";
  else if (type === "praise") category = "praise";
  else if (text.includes("contribute") || text.includes("volunteer") || text.includes("github")) category = "partnership";

  let priority: FeedbackClassification["priority"] = "medium";
  if (category === "bug" || category === "data_error") priority = "high";
  else if (category === "praise") priority = "low";

  const flags: string[] = [];
  if (category === "data_error") flags.push("data_verification_needed");
  if (category === "partnership") flags.push("partnership_opportunity");

  return {
    category,
    priority,
    summary: subject.slice(0, 80),
    confidence: 0.5,
    flags,
    adminWarning: null,
  };
}

export async function classifyFeedback(
  feedbackId: string,
  type: string,
  subject: string,
  message: string,
  module?: string | null,
  district?: string | null
): Promise<FeedbackClassification | null> {
  let parsed: FeedbackClassification;

  try {
    const userPrompt = `Type: ${type}\nSubject: ${subject}\nMessage: ${message.slice(0, 500)}`;

    const response = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      purpose: "classify",
      jsonMode: true,
      maxTokens: 256,
      temperature: 0.1,
    });

    parsed = extractJSON(response.text) as FeedbackClassification;

    // Validate required fields exist
    if (!parsed.category || !parsed.priority) {
      throw new Error("Missing required fields");
    }
  } catch (err) {
    console.error("[feedback-classifier] AI failed, using rule-based fallback:", err instanceof Error ? err.message : err);
    parsed = fallbackClassify(type, subject, message);
  }

  try {
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        aiCategory: parsed.category,
        aiPriority: parsed.priority,
        aiSummary: (parsed.summary || subject).slice(0, 200),
        aiConfidence: parsed.confidence ?? 0.5,
        aiFlags: parsed.flags || [],
        aiAdminWarning: parsed.adminWarning || null,
        aiClassifiedAt: new Date(),
      },
    });
    return parsed;
  } catch (dbErr) {
    console.error("[feedback-classifier] DB update failed:", dbErr);
    return null;
  }
}

export async function batchClassifyFeedback(): Promise<{ classified: number; failed: number; skipped: number; lastError?: string }> {
  const unclassified = await prisma.feedback.findMany({
    where: { aiClassifiedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { district: { select: { name: true } } },
  });

  let classified = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const fb of unclassified) {
    const result = await classifyFeedback(
      fb.id, fb.type, fb.subject, fb.message, fb.module, fb.district?.name
    );
    if (result) classified++;
    else {
      failed++;
      if (!lastError) lastError = "DB update failed for some items";
    }

    // Rate limit: 300ms between calls
    await new Promise((r) => setTimeout(r, 300));
  }

  return { classified, failed, skipped: 0, lastError };
}
