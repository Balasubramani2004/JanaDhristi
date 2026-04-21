/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron: Generate weekly citizen tips for all districts
// POST /api/cron/generate-citizen-tips
// Schedule: Weekly (Vercel cron — see vercel.json)
// Protected by x-cron-secret: CRON_SECRET header
// Generates tips via Gemini and stores in Redis (7-day TTL)
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { callAI } from "@/lib/ai-provider";

const TIPS_TTL = 7 * 24 * 60 * 60; // 7 days

interface CitizenTip {
  category: string;
  icon: string;
  title: string;
  description: string;
  urgency: "now" | "soon" | "general";
}

interface TipsResponse {
  tips: CitizenTip[];
  month: number;
  year: number;
  generatedAt: string;
  generatedBy: "cron";
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SEASONS: Record<string, string> = {
  "1": "Rabi/winter", "2": "Rabi/winter", "3": "summer/pre-monsoon",
  "4": "summer/pre-monsoon", "5": "summer/pre-monsoon",
  "6": "Kharif/monsoon", "7": "Kharif/monsoon", "8": "Kharif/monsoon", "9": "Kharif/monsoon",
  "10": "post-harvest/Rabi sowing", "11": "post-harvest/Rabi sowing",
  "12": "Rabi/winter",
};

function getSeason(month: number): string {
  return SEASONS[String(month)] ?? "general";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateTipsForDistrict(
  districtName: string,
  districtId: string,
  stateName: string,
  month: number,
  year: number,
  weather?: { temperature: number | null; conditions: string | null; rainfall: number | null },
  alerts?: Array<{ title: string; type: string; severity: string }>,
  schemes?: Array<{ name: string }>,
): Promise<CitizenTip[]> {
  const monthName = MONTHS[month - 1];
  const season = getSeason(month);

  const contextParts: string[] = [];
  if (weather) {
    contextParts.push(
      `Weather: ${weather.temperature ?? "?"}°C, ${weather.conditions ?? "unknown"}`
    );
  }
  if (alerts?.length) {
    contextParts.push(
      `Active alerts: ${alerts.map((a) => `${a.title} (${a.severity})`).join(", ")}`
    );
  }
  if (schemes?.length) {
    contextParts.push(`Government schemes: ${schemes.map((s) => s.name).join(", ")}`);
  }
  const contextData =
    contextParts.length > 0 ? contextParts.join(". ") : "General district context";

  const prompt = `You are a civic advisor for ${districtName} district, ${stateName}, India. Generate exactly 6 practical, actionable citizen tips for ${monthName} ${year} (${season} season).

Current district context: ${contextData}

Respond ONLY with a valid JSON array (no markdown, no extra text):
[
  {
    "category": "Agriculture|Health|Finance|Water|Rights|Safety|Education|Environment",
    "icon": "single emoji",
    "title": "short action title (max 8 words)",
    "description": "2-3 sentences of specific, practical advice relevant to ${districtName} citizens in ${monthName}",
    "urgency": "now|soon|general"
  }
]

Guidelines:
- Mix categories: 2 agriculture, 1 health, 1 government scheme, 1 safety/emergency, 1 civic duty
- Be hyper-local — mention ${districtName}-specific context where possible
- urgency "now" = must do this week, "soon" = this month, "general" = evergreen advice
- Write for ordinary citizens, not experts
- Use Indian context (schemes, government portals, local practices)`;

  try {
    const response = await callAI({
      systemPrompt: `You are a civic advisor for ${districtName} district, ${stateName}, India.`,
      userPrompt: prompt,
      purpose: "summarize",
      jsonMode: true,
    });

    const text = response.text.trim();
    const jsonStr = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(jsonStr) as CitizenTip[];
  } catch (err) {
    console.error(`[citizen-tips cron] Failed for ${districtName}:`, err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const generatedAt = now.toISOString();

  // Next refresh: 7 days from now
  const nextRefreshDate = new Date(now.getTime() + TIPS_TTL * 1000);
  const nextRefreshDays = 7;

  const results: { district: string; ok: boolean; count: number }[] = [];

  try {
    // Get all active districts
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { name: true } } },
    });

    console.log(`[citizen-tips cron] Generating tips for ${districts.length} districts...`);

    for (const district of districts) {
      // Gather context (lightweight)
      const [weather, alerts, schemes] = await Promise.all([
        prisma.weatherReading.findFirst({
          where: { districtId: district.id },
          orderBy: { recordedAt: "desc" },
          select: { temperature: true, conditions: true, rainfall: true },
        }),
        prisma.localAlert.findMany({
          where: { districtId: district.id, active: true },
          take: 3,
          select: { title: true, type: true, severity: true },
        }),
        prisma.scheme.findMany({
          where: { districtId: district.id, active: true },
          take: 3,
          select: { name: true },
        }),
      ]);

      const tips = await generateTipsForDistrict(
        district.name,
        district.id,
        district.state.name,
        month,
        year,
        weather ?? undefined,
        alerts,
        schemes,
      );

      const cacheKey = `ftp:ai:citizen-tips:${district.slug}`;
      const payload: TipsResponse = {
        tips,
        month,
        year,
        generatedAt,
        generatedBy: "cron",
      };

      // Store for 7 days
      await cacheSet(cacheKey, payload, TIPS_TTL);

      results.push({ district: district.slug, ok: tips.length > 0, count: tips.length });

      // Rate limit: 2s between districts to avoid API limits
      await sleep(2000);
    }

    console.log(`[citizen-tips cron] Done. ${results.filter((r) => r.ok).length}/${districts.length} districts succeeded.`);

    return NextResponse.json({
      success: true,
      generatedAt,
      nextRefreshInDays: nextRefreshDays,
      nextRefreshDate: nextRefreshDate.toISOString(),
      results,
    });
  } catch (err) {
    console.error("[citizen-tips cron] Error:", err);
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}
