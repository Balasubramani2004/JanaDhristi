/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Crop Prices — AGMARKNET via data.gov.in API
// Schedule: Every 15 min (6AM–8PM IST)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { logUpdate } from "@/lib/update-log";
import { fetchKarnatakaApmcRecords, type CropProviderRecord } from "@/scraper/providers/karnataka-apmc";

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

// Override map for districts where AGMARKNET name differs from district name
const AGMARKNET_DISTRICT_OVERRIDE: Record<string, string> = {
  "bengaluru-urban": "Bangalore",
  "mysuru":          "Mysore",
  "new-delhi":       "Delhi",
  "central-delhi":   "Delhi",
  "north-delhi":     "Delhi",
  "north-west-delhi":"Delhi",
  "north-east-delhi":"Delhi",
  "east-delhi":      "Delhi",
  "south-delhi":     "Delhi",
  "south-west-delhi":"Delhi",
  "south-east-delhi":"Delhi",
  "west-delhi":      "Delhi",
  "shahdara":        "Delhi",
  "mumbai":          "Mumbai",
  "kolkata":         "Kolkata",
  "chennai":         "Chennai",
};

interface AgmarkRecord {
  commodity: string;
  variety: string;
  district: string;
  market: string;
  min_price: number | string;
  max_price: number | string;
  modal_price: number | string;
  arrival_date: string;
  grade?: string;
  state?: string;
}

function parseAgmarkDate(dateStr: string): Date | null {
  const [dd, mm, yyyy] = dateStr.split("/");
  const date = new Date(`${yyyy}-${mm}-${dd}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAgmarkRecords(records: AgmarkRecord[]): CropProviderRecord[] {
  return records
    .map((r) => {
      if (!r.arrival_date) return null;
      const date = parseAgmarkDate(r.arrival_date);
      if (!date) return null;
      return {
        commodity: r.commodity,
        variety: r.variety || null,
        market: r.market,
        minPrice: Number(r.min_price) || 0,
        maxPrice: Number(r.max_price) || 0,
        modalPrice: Number(r.modal_price) || 0,
        arrivalDate: date,
        source: "AGMARKNET / data.gov.in",
      } satisfies CropProviderRecord;
    })
    .filter((x): x is CropProviderRecord => Boolean(x));
}

async function upsertCropRecords(ctx: JobContext, records: CropProviderRecord[]) {
  let newCount = 0;
  let updatedCount = 0;

  for (const r of records) {
    const existing = await prisma.cropPrice.findFirst({
      where: {
        districtId: ctx.districtId,
        commodity: r.commodity,
        market: r.market,
        date: r.arrivalDate,
      },
    });
    if (!existing) {
      await prisma.cropPrice.create({
        data: {
          districtId: ctx.districtId,
          commodity: r.commodity,
          variety: r.variety,
          market: r.market,
          minPrice: r.minPrice,
          maxPrice: r.maxPrice,
          modalPrice: r.modalPrice,
          date: r.arrivalDate,
          source: r.source,
          fetchedAt: new Date(),
        },
      });
      newCount++;
      continue;
    }

    const samePrices =
      existing.minPrice === r.minPrice &&
      existing.maxPrice === r.maxPrice &&
      existing.modalPrice === r.modalPrice &&
      (existing.variety ?? "") === (r.variety ?? "");
    if (!samePrices) {
      await prisma.cropPrice.update({
        where: { id: existing.id },
        data: {
          minPrice: r.minPrice,
          maxPrice: r.maxPrice,
          modalPrice: r.modalPrice,
          variety: r.variety,
          source: r.source,
          fetchedAt: new Date(),
        },
      });
      updatedCount++;
    }
  }

  return { newCount, updatedCount };
}

export async function scrapeCrops(ctx: JobContext): Promise<ScraperResult> {
  try {
    let providerUsed = "agmarknet";
    let fetchedRecords: CropProviderRecord[] = [];

    const isKarnatakaDistrict = ctx.stateSlug.toLowerCase() === "karnataka";
    if (isKarnatakaDistrict) {
      try {
        fetchedRecords = await fetchKarnatakaApmcRecords(ctx);
        if (fetchedRecords.length > 0) {
          providerUsed = "karnataka-apmc";
        } else {
          ctx.log("[crops] Karnataka source returned 0 records, trying AGMARKNET fallback");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ctx.log(`[crops] Karnataka source failed (${msg}), trying AGMARKNET fallback`);
      }
    }

    if (fetchedRecords.length === 0) {
      if (!API_KEY) {
        ctx.log("DATA_GOV_API_KEY not set — skipping");
        return { success: false, recordsNew: 0, recordsUpdated: 0, error: "No API key" };
      }

      const state = ctx.stateName ?? (ctx.stateSlug.charAt(0).toUpperCase() + ctx.stateSlug.slice(1));
      const district = AGMARKNET_DISTRICT_OVERRIDE[ctx.districtSlug] ?? ctx.districtName ?? ctx.districtSlug;
      const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&filters[state]=${encodeURIComponent(state)}&filters[district]=${encodeURIComponent(district)}&limit=100`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const agmarkRecords: AgmarkRecord[] = json.records ?? [];
      fetchedRecords = normalizeAgmarkRecords(agmarkRecords);
      providerUsed = "agmarknet";
    }

    const { newCount, updatedCount } = await upsertCropRecords(ctx, fetchedRecords);

    // Keep only last 100 records
    const old = await prisma.cropPrice.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { date: "desc" },
      skip: 100,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.cropPrice.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }

    const summary = `Crop prices (${providerUsed}): ${newCount} new, ${updatedCount} updated from ${fetchedRecords.length} fetched`;
    ctx.log(summary);

    if (newCount > 0 || updatedCount > 0) {
      await logUpdate({
        source: "scraper",
        actorLabel: "cron",
        tableName: "CropPrice",
        recordId: `${ctx.districtId}:${Date.now()}`,
        action: newCount > 0 ? "create" : "update",
        districtId: ctx.districtId,
        districtName: ctx.districtName,
        moduleName: "crops",
        description: summary,
        recordCount: newCount + updatedCount,
        details: { providerUsed, fetched: fetchedRecords.length, inserted: newCount, updated: updatedCount },
      });
    }

    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
