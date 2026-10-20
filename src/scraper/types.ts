/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Scraper job types
// ═══════════════════════════════════════════════════════════

export interface ScraperResult {
  success: boolean;
  recordsNew: number;
  recordsUpdated: number;
  error?: string;
}

export interface JobContext {
  districtSlug: string;
  districtId: string;
  districtName: string;
  stateSlug: string;
  stateName: string;
  log: (msg: string) => void;
}

export type ScraperJob = (ctx: JobContext) => Promise<ScraperResult>;
