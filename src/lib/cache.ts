/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Redis cache helpers
// ═══════════════════════════════════════════════════════════
import redis from "./redis";
import { getModuleTtlSeconds } from "./module-freshness";

export function cacheKey(districtSlug: string, module: string): string {
  return `ftp:${districtSlug}:${module}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redis) return null;
    // @upstash/redis returns parsed JSON automatically
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    if (!redis) return;
    // @upstash/redis uses { ex: seconds } instead of ioredis "EX", seconds
    await redis.set(key, data, { ex: ttlSeconds });
  } catch {
    // Non-fatal: proceed without cache
  }
}

/** Redis TTL seconds per district module — see `src/lib/module-freshness.ts`. */
export function getModuleTTL(module: string): number {
  return getModuleTtlSeconds(module);
}
