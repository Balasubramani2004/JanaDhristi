/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * Single source of truth for district module cache TTL (Redis + CDN) and
 * client React Query cadence. Safe to import from client components (no Redis).
 */

/** Multi-district listing APIs (homepage trends, stats, globe, global trends). */
export const HOME_AGGREGATE_TTL_SEC = 90;

/** Scraped or frequently changing observational data */
const LIVE = new Set([
  "crops",
  "weather",
  "water",
  "news",
  "power",
  "agri",
  "infrastructure",
  "soil",
]);

/** Gov / civic modules that update on a slower cadence but should not sit behind 5m default */
const SEMI = new Set([
  "schemes",
  "transport",
  "police",
  "jjm",
  "housing",
  "factories",
  "local-industries",
  "services",
  "tips",
  "population",
  "budget",
  "revenue",
  "overview",
]);

const STABLE = new Set([
  "leaders",
  "offices",
  "elections",
  "schools",
  "exams",
  "tourism",
  "panchayats",
  "taluks",
  "famous-personalities",
]);

export function getModuleTtlSeconds(module: string): number {
  if (LIVE.has(module)) return 60;
  if (STABLE.has(module)) return 600;
  if (SEMI.has(module)) return 120;
  return 120;
}

/** React Query staleTime — slightly below server TTL so refetch hits fresher Redis/DB */
export function getDistrictModuleStaleTimeMs(module: string): number {
  const ttl = getModuleTtlSeconds(module);
  if (ttl <= 60) return 20_000;
  if (ttl <= 120) return 40_000;
  return 90_000;
}

export function getDistrictModuleRefetchIntervalMs(module: string): number | false {
  const ttl = getModuleTtlSeconds(module);
  if (ttl <= 60) return 50_000;
  if (ttl <= 120) return 100_000;
  return false;
}
