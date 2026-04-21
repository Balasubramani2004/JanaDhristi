/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */
import { redis } from "./redis";

/**
 * Simple sliding-window rate limiter using Upstash Redis.
 * Falls back to "allow" if Redis is unavailable.
 *
 * @param identifier - unique key (e.g. IP address + route)
 * @param limit      - max requests per window (default: 60)
 * @param window     - window size in seconds (default: 60)
 */
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  window: number = 60
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    // Redis unavailable — degrade gracefully (allow all)
    return { success: true, remaining: limit };
  }

  const key = `rate:${identifier}`;
  try {
    const current = (await redis.incr(key)) as number;
    if (current === 1) {
      await redis.expire(key, window);
    }
    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch {
    // Redis error — degrade gracefully
    return { success: true, remaining: limit };
  }
}
