/**
 * Karnataka APMC provider adapter
 *
 * This adapter supports either:
 * 1) a district-scoped endpoint template via KARNATAKA_APMC_SOURCE_URL, or
 * 2) a pre-bucketed JSON payload when no placeholders are used.
 *
 * Template placeholders supported:
 * - {districtSlug}
 * - {districtName}
 * - {stateSlug}
 * - {stateName}
 */
import type { JobContext } from "@/scraper/types";

export interface CropProviderRecord {
  commodity: string;
  variety: string | null;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalDate: Date;
  source: string;
}

type RawRecord = {
  commodity?: string;
  crop?: string;
  variety?: string;
  market?: string;
  mandi?: string;
  min_price?: number | string;
  max_price?: number | string;
  modal_price?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  modalPrice?: number | string;
  date?: string;
  arrival_date?: string;
  source?: string;
};

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = value.match(ddmmyyyy);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asNumber(v: number | string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toNormalized(record: RawRecord): CropProviderRecord | null {
  const commodity = (record.commodity ?? record.crop ?? "").trim();
  const market = (record.market ?? record.mandi ?? "").trim();
  const arrivalDate = parseDate(record.arrival_date ?? record.date);
  if (!commodity || !market || !arrivalDate) return null;

  return {
    commodity,
    variety: (record.variety ?? "").trim() || null,
    market,
    minPrice: asNumber(record.min_price ?? record.minPrice),
    maxPrice: asNumber(record.max_price ?? record.maxPrice),
    modalPrice: asNumber(record.modal_price ?? record.modalPrice),
    arrivalDate,
    source: (record.source ?? "Karnataka APMC").trim(),
  };
}

function resolveTemplate(url: string, ctx: JobContext): string {
  return url
    .replaceAll("{districtSlug}", encodeURIComponent(ctx.districtSlug))
    .replaceAll("{districtName}", encodeURIComponent(ctx.districtName))
    .replaceAll("{stateSlug}", encodeURIComponent(ctx.stateSlug))
    .replaceAll("{stateName}", encodeURIComponent(ctx.stateName));
}

export async function fetchKarnatakaApmcRecords(ctx: JobContext): Promise<CropProviderRecord[]> {
  if ((process.env.KARNATAKA_APMC_SOURCE_ENABLED ?? "true").toLowerCase() !== "true") {
    return [];
  }
  const baseUrl = process.env.KARNATAKA_APMC_SOURCE_URL;
  if (!baseUrl) return [];

  const endpoint = resolveTemplate(baseUrl, ctx);
  const res = await fetch(endpoint, {
    headers: { "User-Agent": "JanaDhristi Crop Ingestion" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Karnataka provider HTTP ${res.status}`);

  const json = await res.json();
  const rawRecords: RawRecord[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.records)
    ? json.records
    : Array.isArray(json?.data)
    ? json.data
    : [];

  return rawRecords
    .map(toNormalized)
    .filter((x): x is CropProviderRecord => Boolean(x));
}
