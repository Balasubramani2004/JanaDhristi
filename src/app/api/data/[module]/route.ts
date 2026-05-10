/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Unified API Route: /api/data/[module]
// Query params: ?district=mandya&state=karnataka&taluk=...
// Response: { data: T, meta: { district, module, updatedAt, fromCache } }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheKey, getModuleTTL } from "@/lib/cache";

// ── Params type (Next.js 15+) ───────────────────────────
type RouteContext = { params: Promise<{ module: string }> };
const DISABLED_MODULES = new Set(["rti", "courts", "elections", "alerts"]);
const TRANSLATABLE_MODULES = new Set(["news", "infrastructure", "agri", "weather"]);

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { module } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";
  const talukSlug = sp.get("taluk") ?? "";
  const locale = sp.get("locale") ?? "en";

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }
  if (DISABLED_MODULES.has(module)) {
    return NextResponse.json({ error: `Module removed: ${module}` }, { status: 404 });
  }

  // ── Cache check ──────────────────────────────────────
  const localeKey = locale !== "en" && TRANSLATABLE_MODULES.has(module) ? `:${locale}` : "";
  const key = cacheKey(districtSlug, module + (talukSlug ? `:${talukSlug}` : "") + localeKey);
  const cached = await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(key);
  if (cached) {
    const ttl = getModuleTTL(module);
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return resp;
  }

  // ── Fetch ────────────────────────────────────────────
  try {
    const result = await fetchModule(module, districtSlug, stateSlug, talukSlug, locale);
    try {
      await cacheSet(key, result, getModuleTTL(module));
    } catch (cacheErr) {
      console.warn(`[API] cacheSet skipped for ${module}/${districtSlug}:`, cacheErr);
    }
    const ttl = getModuleTTL(module);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error(`[API] ${module} error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseDurationHours(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const m = duration.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

type NewsResponseItem = {
  id: string;
  districtId: string;
  title: string;
  headline: string;
  summary: string | null;
  source: string;
  url: string | null;
  category: string;
  publishedAt: Date;
  targetModule: string | null;
  moduleAction: string | null;
};

async function translateTextBatch(texts: string[], target: "kn" | "hi"): Promise<string[] | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || texts.length === 0) return null;
  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, target, format: "text" }),
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };
    const translated = json.data?.translations?.map((x) => x.translatedText ?? "") ?? [];
    if (translated.length !== texts.length) return null;
    return translated;
  } catch {
    return null;
  }
}

async function translateOptionalFieldList(
  values: Array<string | null | undefined>,
  target: "kn" | "hi"
): Promise<Array<string | null | undefined>> {
  const indices: number[] = [];
  const texts: string[] = [];
  values.forEach((v, i) => {
    if (typeof v === "string" && v.trim().length > 0) {
      indices.push(i);
      texts.push(v);
    }
  });
  if (texts.length === 0) return values;
  const translated = await translateTextBatch(texts, target);
  if (!translated) return values;
  const output = [...values];
  indices.forEach((idx, i) => {
    output[idx] = translated[i] || output[idx];
  });
  return output;
}

async function translateNewsItems(data: NewsResponseItem[], target: "kn" | "hi"): Promise<NewsResponseItem[]> {
  const headlines = data.map((d) => d.headline ?? d.title);
  const summaries = data.map((d) => d.summary ?? "");
  const [translatedHeadlines, translatedSummaries] = await Promise.all([
    translateTextBatch(headlines, target),
    translateTextBatch(summaries, target),
  ]);
  if (!translatedHeadlines) return data;
  return data.map((item, idx) => ({
    ...item,
    headline: translatedHeadlines[idx] || item.headline,
    summary: item.summary ? (translatedSummaries?.[idx] || item.summary) : item.summary,
  }));
}

type InfraUpdateResponseItem = {
  headline: string;
  summary: string | null;
  newsTitle: string | null;
  [k: string]: unknown;
};

type InfraResponseItem = {
  name: string;
  shortName?: string | null;
  description?: string | null;
  scope?: string | null;
  updates?: InfraUpdateResponseItem[];
  [k: string]: unknown;
};

async function translateInfrastructureItems(data: InfraResponseItem[], target: "kn" | "hi"): Promise<InfraResponseItem[]> {
  const names = await translateOptionalFieldList(data.map((p) => p.name), target);
  const shortNames = await translateOptionalFieldList(data.map((p) => p.shortName), target);
  const descriptions = await translateOptionalFieldList(data.map((p) => p.description), target);
  const scopes = await translateOptionalFieldList(data.map((p) => p.scope), target);

  const updatesFlat = data.flatMap((p) => p.updates ?? []);
  const translatedUpdateHeadlines = await translateOptionalFieldList(updatesFlat.map((u) => u.headline), target);
  const translatedUpdateSummaries = await translateOptionalFieldList(updatesFlat.map((u) => u.summary), target);
  const translatedUpdateNewsTitles = await translateOptionalFieldList(updatesFlat.map((u) => u.newsTitle), target);

  let updateCursor = 0;
  return data.map((item, idx) => {
    const updates = (item.updates ?? []).map((u) => {
      const mapped = {
        ...u,
        headline: translatedUpdateHeadlines[updateCursor] ?? u.headline,
        summary: translatedUpdateSummaries[updateCursor] ?? u.summary,
        newsTitle: translatedUpdateNewsTitles[updateCursor] ?? u.newsTitle,
      };
      updateCursor += 1;
      return mapped;
    });
    return {
      ...item,
      name: (names[idx] as string) ?? item.name,
      shortName: (shortNames[idx] as string | null | undefined) ?? item.shortName,
      description: (descriptions[idx] as string | null | undefined) ?? item.description,
      scope: (scopes[idx] as string | null | undefined) ?? item.scope,
      updates,
    };
  });
}

type AgriAdvisoryResponseItem = {
  crop: string;
  advisory: string;
  [k: string]: unknown;
};

async function translateAgriAdvisories(data: AgriAdvisoryResponseItem[], target: "kn" | "hi"): Promise<AgriAdvisoryResponseItem[]> {
  const crops = await translateOptionalFieldList(data.map((d) => d.crop), target);
  const advisories = await translateOptionalFieldList(data.map((d) => d.advisory), target);
  return data.map((item, idx) => ({
    ...item,
    crop: (crops[idx] as string) ?? item.crop,
    advisory: (advisories[idx] as string) ?? item.advisory,
  }));
}

// ── Module resolver ──────────────────────────────────────
async function fetchModule(
  module: string,
  districtSlug: string,
  _stateSlug: string,
  talukSlug: string,
  locale: string
) {
  const now = new Date().toISOString();
  const meta = { module, district: districtSlug, updatedAt: now, fromCache: false };

  // Resolve district id once
  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true, nameLocal: true },
  });

  if (!district) return { data: null, meta: { ...meta, error: "District not found" } };

  const did = district.id;

  switch (module) {
    // ══════════════════════════════════════════════════
    // 1. OVERVIEW
    // ══════════════════════════════════════════════════
    case "overview": {
      const d = await prisma.district.findUnique({
        where: { id: did },
        include: {
          taluks: { select: { id: true, name: true, nameLocal: true, slug: true } },
          leaders: { orderBy: { tier: "asc" } },
          _count: {
            select: {
              infraProjects: true,
              schemes: true,
              policeStations: true,
              schools: true,
            },
          },
        },
      });
      return { data: d, meta };
    }

    // ══════════════════════════════════════════════════
    // 2. LEADERS
    // ══════════════════════════════════════════════════
    case "leaders": {
      // Use DISTINCT ON via raw query to deduplicate by name+role, keeping newest.
      // Filters out rows explicitly marked inactive (e.g. replaced officeholders).
      const raw = await prisma.$queryRaw<{
        id: string; districtId: string; name: string; role: string; tier: number;
        party: string | null; constituency: string | null; since: string | null;
        photoUrl: string | null; source: string | null; lastVerifiedAt: Date | null;
        active: boolean; roleDescription: string | null;
      }[]>`
        SELECT DISTINCT ON (LOWER("name"), LOWER("role"))
          id, "districtId", name, role, tier,
          party, constituency, since, "photoUrl",
          source, "lastVerifiedAt", active, "roleDescription"
        FROM "Leader"
        WHERE "districtId" = ${did} AND active = true
        ORDER BY LOWER("name"), LOWER("role"), id DESC
      `;
      const data = raw.map(r => ({
        ...r,
        lastVerifiedAt: r.lastVerifiedAt ? r.lastVerifiedAt.toISOString() : null,
        talukId: null,
        nameLocal: null,
        roleLocal: null,
        phone: null,
        email: null,
        photoLicense: null,
      }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 3. BUDGET
    // ══════════════════════════════════════════════════
    case "budget": {
      const [entries, allocations] = await Promise.all([
        prisma.budgetEntry.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { sector: "asc" }],
        }),
        prisma.budgetAllocation.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { department: "asc" }],
        }),
      ]);
      return { data: { entries, allocations }, meta };
    }

    // ══════════════════════════════════════════════════
    // 4. REVENUE
    // ══════════════════════════════════════════════════
    case "revenue": {
      const [entries, collections] = await Promise.all([
        prisma.revenueEntry.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { month: "asc" }],
        }),
        prisma.revenueCollection.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { month: "desc" }],
          take: 24,
        }),
      ]);
      return { data: { entries, collections }, meta };
    }

    // ══════════════════════════════════════════════════
    // 5. CROPS
    // ══════════════════════════════════════════════════
    case "crops": {
      const data = await prisma.cropPrice.findMany({
        where: { districtId: did },
        orderBy: [{ date: "desc" }, { commodity: "asc" }],
        take: 100,
      });
      return { data, meta: { ...meta, lastUpdated: data[0]?.date?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 6. WEATHER
    // ══════════════════════════════════════════════════
    case "weather": {
      const data = await prisma.weatherReading.findMany({
        where: { districtId: did },
        orderBy: { recordedAt: "desc" },
        take: 48,
      });
      if (!["kn", "hi"].includes(locale)) {
        return { data, meta: { ...meta, lastUpdated: data[0]?.recordedAt?.toISOString() ?? null } };
      }
      const translatedConditions = await translateOptionalFieldList(
        data.map((w) => w.conditions),
        locale as "kn" | "hi"
      );
      const translatedData = data.map((w, idx) => ({
        ...w,
        conditions: (translatedConditions[idx] as string | null | undefined) ?? w.conditions,
      }));
      return { data: translatedData, meta: { ...meta, lastUpdated: translatedData[0]?.recordedAt?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 7. RAINFALL
    // ══════════════════════════════════════════════════
    case "rainfall": {
      const data = await prisma.rainfallHistory.findMany({
        where: { districtId: did },
        orderBy: [{ year: "desc" }, { month: "asc" }],
        take: 60,
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 8. SOIL
    // ══════════════════════════════════════════════════
    case "soil": {
      const [soil, advisories] = await Promise.all([
        prisma.soilHealth.findMany({
          where: { districtId: did },
          orderBy: { testedAt: "desc" },
          take: 20,
        }),
        prisma.agriAdvisory.findMany({
          where: { districtId: did },
          orderBy: { weekOf: "desc" },
          take: 10,
        }),
      ]);
      return { data: { soil, advisories }, meta };
    }

    // ══════════════════════════════════════════════════
    // 9. WATER (dams + canals)
    // ══════════════════════════════════════════════════
    case "water": {
      const [dams, canals] = await Promise.all([
        prisma.damReading.findMany({
          where: { districtId: did },
          orderBy: { recordedAt: "desc" },
          take: 20,
        }),
        prisma.canalRelease.findMany({
          where: { districtId: did },
          orderBy: { scheduledDate: "desc" },
          take: 20,
        }),
      ]);
      return { data: { dams, canals }, meta: { ...meta, lastUpdated: dams[0]?.recordedAt?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 10. INFRASTRUCTURE
    // ══════════════════════════════════════════════════
    case "infrastructure": {
      const data = await prisma.infraProject.findMany({
        where: { districtId: did },
        include: {
          updates: {
            orderBy: { date: "desc" },
            take: 25,
            select: {
              id: true, date: true, headline: true, summary: true,
              updateType: true, personName: true, personRole: true, personParty: true,
              budgetChange: true, progressPct: true, statusChange: true,
              newsUrl: true, newsTitle: true, newsSource: true, newsDate: true,
              verified: true,
            },
          },
        },
        orderBy: [{ lastNewsAt: "desc" }, { status: "asc" }, { startDate: "desc" }],
      });
      const infraUpdated = data.reduce<Date | null>((latest, p) => {
        const ts = (p as { updatedAt?: Date }).updatedAt;
        if (!ts) return latest;
        return !latest || ts > latest ? ts : latest;
      }, null);
      if (!["kn", "hi"].includes(locale)) {
        return { data, meta: { ...meta, lastUpdated: infraUpdated?.toISOString() ?? null } };
      }
      const translatedData = await translateInfrastructureItems(data as unknown as InfraResponseItem[], locale as "kn" | "hi");
      return { data: translatedData, meta: { ...meta, lastUpdated: infraUpdated?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 11. SCHEMES
    // ══════════════════════════════════════════════════
    case "schemes": {
      const data = await prisma.scheme.findMany({
        where: { districtId: did },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 12. NEWS
    // ══════════════════════════════════════════════════
    case "news": {
      const rows = await prisma.newsItem.findMany({
        where: { districtId: did },
        orderBy: { publishedAt: "desc" },
        take: 30,
      });
      const data: NewsResponseItem[] = rows.map((r) => ({
        ...r,
        headline: r.title,
        districtId: r.districtId ?? did,
        category: r.category ?? "",
      }));
      if (!["kn", "hi"].includes(locale)) return { data, meta };
      const translatedData = await translateNewsItems(data, locale as "kn" | "hi");
      return { data: translatedData, meta };
    }

    // ══════════════════════════════════════════════════
    // 13. POLICE
    // ══════════════════════════════════════════════════
    case "police": {
      const [stations, crime, traffic] = await Promise.all([
        prisma.policeStation.findMany({
          where: { districtId: did },
          orderBy: { name: "asc" },
        }),
        prisma.crimeStat.findMany({
          where: { districtId: did },
          orderBy: [{ year: "desc" }, { category: "asc" }],
        }),
        prisma.trafficCollection.findMany({
          where: { districtId: did },
          orderBy: { date: "desc" },
          take: 24,
        }),
      ]);
      return { data: { stations, crime, traffic }, meta };
    }


    // ══════════════════════════════════════════════════
    // 17. PANCHAYATS
    // ══════════════════════════════════════════════════
    case "panchayats": {
      const wherePanch: { districtId: string; talukId?: string } = { districtId: did };
      if (talukSlug) {
        const talukRow = await prisma.taluk.findFirst({
          where: { districtId: did, slug: talukSlug },
          select: { id: true },
        });
        if (!talukRow) {
          return { data: [], meta };
        }
        wherePanch.talukId = talukRow.id;
      }
      const data = await prisma.gramPanchayat.findMany({
        where: wherePanch,
        orderBy: { name: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // TOURISM (district highlights — static / curated)
    // ══════════════════════════════════════════════════
    case "tourism": {
      try {
        const data = await prisma.tourismPlace.findMany({
          where: { districtId: did },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
        return { data, meta };
      } catch (tourismErr) {
        console.error("[API] tourism prisma:", tourismErr);
        return { data: [], meta };
      }
    }

    // ══════════════════════════════════════════════════
    // 18. SCHOOLS
    // ══════════════════════════════════════════════════
    case "schools": {
      const data = await prisma.school.findMany({
        where: { districtId: did },
        include: { results: { orderBy: { year: "desc" }, take: 3 } },
        orderBy: { name: "asc" },
        take: 200,
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 19. JJM (Jal Jeevan Mission)
    // ══════════════════════════════════════════════════
    case "jjm": {
      const data = await prisma.jJMStatus.findMany({
        where: { districtId: did },
        orderBy: { coveragePct: "desc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 20. HOUSING
    // ══════════════════════════════════════════════════
    case "housing": {
      const data = await prisma.housingScheme.findMany({
        where: { districtId: did },
        orderBy: { schemeName: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 21. POWER
    // ══════════════════════════════════════════════════
    case "power": {
      const rows = await prisma.powerOutage.findMany({
        where: { districtId: did },
        orderBy: { startTime: "desc" },
        take: 30,
      });
      const data = rows.map((o) => ({
        id: o.id,
        area: o.area,
        type: o.type,
        reason: o.reason,
        startTime: o.startTime,
        endTime: o.endTime,
        durationHours: parseDurationHours(o.duration),
        affectedHouseholds: null as number | null,
        source: o.source,
        active: o.active,
      }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 22. TRANSPORT
    // ══════════════════════════════════════════════════
    case "transport": {
      const [buses, trains] = await Promise.all([
        prisma.busRoute.findMany({
          where: { districtId: did },
          orderBy: { routeNumber: "asc" },
        }),
        prisma.trainSchedule.findMany({
          where: { districtId: did },
          orderBy: { trainNumber: "asc" },
        }),
      ]);
      return { data: { buses, trains }, meta };
    }

    // ══════════════════════════════════════════════════
    // 23. FACTORIES (Sugar)
    // ══════════════════════════════════════════════════
    case "factories": {
      const data = await prisma.sugarFactory.findMany({
        where: { districtId: did },
        include: {
          seasonData: { orderBy: { season: "desc" }, take: 3 },
        },
        orderBy: { name: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // LOCAL INDUSTRIES (IT Parks, Heritage, etc.)
    // ══════════════════════════════════════════════════
    case "local-industries": {
      const data = await prisma.localIndustry.findMany({
        where: { districtId: did, active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 24. SERVICES (Citizen service guides)
    // ══════════════════════════════════════════════════
    case "services": {
      const data = await prisma.serviceGuide.findMany({
        where: { districtId: did },
        orderBy: { category: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 25. TIPS (Citizen tips)
    // ══════════════════════════════════════════════════
    case "tips": {
      const data = await prisma.citizenTip.findMany({
        where: { districtId: did },
        orderBy: { category: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 27. OFFICES (Government offices)
    // ══════════════════════════════════════════════════
    case "offices": {
      const data = await prisma.govOffice.findMany({
        where: { districtId: did },
        orderBy: [{ department: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 28. AGRI (Agri advisories)
    // ══════════════════════════════════════════════════
    case "agri": {
      const data = await prisma.agriAdvisory.findMany({
        where: { districtId: did },
        orderBy: { weekOf: "desc" },
        take: 20,
      });
      if (!["kn", "hi"].includes(locale)) return { data, meta };
      const translatedData = await translateAgriAdvisories(data as unknown as AgriAdvisoryResponseItem[], locale as "kn" | "hi");
      return { data: translatedData, meta };
    }

    // ══════════════════════════════════════════════════
    // 29. POPULATION
    // ══════════════════════════════════════════════════
    case "population": {
      // Exclude non-district metro-area estimates (e.g. "Mumbai Metropolitan Region")
      // so Overview (district) and Population page (district census) stay consistent.
      const data = await prisma.populationHistory.findMany({
        where: {
          districtId: did,
          NOT: { source: { contains: "Metropolitan Region", mode: "insensitive" } },
        },
        orderBy: { year: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 30. TALUKS
    // ══════════════════════════════════════════════════
    case "taluks": {
      const data = await prisma.taluk.findMany({
        where: { districtId: did },
        include: {
          villages: { orderBy: { name: "asc" } },
          _count: { select: { villages: true } },
        },
        orderBy: { name: "asc" },
      });
      return { data, meta };
    }

    case "famous-personalities": {
      const data = await prisma.famousPersonality.findMany({
        where: { districtId: did, active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    default:
      return { data: null, meta: { ...meta, error: `Unknown module: ${module}` } };
  }
}
