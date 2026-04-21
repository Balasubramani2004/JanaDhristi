// ── ForThePeople.in — Smart Scraping Tiers ────────────────
// Tiered scraping frequency based on data change rate.
// Reduces unnecessary API calls by 70%+ without losing freshness.

export interface ScrapingTier {
  refreshInterval?: number; // ms — how often scrapers run
  redisTTL: number;         // seconds — Redis cache TTL
  modules: string[];
}

export const SCRAPING_TIERS = {
  // TIER 1: Real-time data (changes multiple times per day)
  REALTIME: {
    refreshInterval: 5 * 60 * 1000,  // 5 minutes
    redisTTL: 300,                    // 5 min cache
    modules: ["weather", "market-ticker"],
  } as ScrapingTier,

  // TIER 2: Frequently updated (changes daily)
  DAILY: {
    refreshInterval: 60 * 60 * 1000, // 1 hour
    redisTTL: 3600,                   // 1 hour cache
    modules: ["crops", "water", "news", "power", "alerts"],
  } as ScrapingTier,

  // TIER 3: Weekly updates
  WEEKLY: {
    refreshInterval: 6 * 60 * 60 * 1000, // 6 hours
    redisTTL: 21600,                       // 6 hour cache
    modules: ["jjm", "housing", "courts", "rti", "police"],
  } as ScrapingTier,

  // TIER 4: Monthly/Rarely changes
  MONTHLY: {
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    redisTTL: 86400,                        // 24 hour cache
    modules: [
      "population", "leadership", "schools", "schemes",
      "services", "offices", "transport", "farm",
      "finance", "elections", "gram-panchayat", "citizen-corner",
      "industries", "rti-templates", "responsibility",
    ],
  } as ScrapingTier,

  // TIER 5: On-demand — only scrape when someone visits the page
  ON_DEMAND: {
    redisTTL: 43200, // 12 hour cache
    modules: ["famous-personalities", "infrastructure", "health"],
  } as ScrapingTier,
} as const;

// Get the TTL for a given module
export function getModuleTTL(module: string): number {
  for (const tier of Object.values(SCRAPING_TIERS)) {
    if (tier.modules.includes(module)) return tier.redisTTL;
  }
  return SCRAPING_TIERS.WEEKLY.redisTTL; // default
}

// Get the refresh interval for a given module (ms)
export function getModuleRefreshInterval(module: string): number {
  for (const tier of Object.values(SCRAPING_TIERS)) {
    if (tier.modules.includes(module) && "refreshInterval" in tier && tier.refreshInterval) {
      return tier.refreshInterval;
    }
  }
  return SCRAPING_TIERS.WEEKLY.refreshInterval!;
}
