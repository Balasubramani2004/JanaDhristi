/**
 * Clear Redis crops (and overview) cache for all active districts
 * Run: npx tsx scripts/clear-crops-cache.ts
 */
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.REDIS_URL;
const token = process.env.REDIS_TOKEN;

if (!url || !token) {
  console.log("REDIS_URL or REDIS_TOKEN not set — cache is disabled, no action needed.");
  process.exit(0);
}

const redis = new Redis({ url, token });

const districts = ["mandya", "mysuru", "bengaluru-urban"];
const modules = ["crops", "overview", "news"];

async function main() {
  for (const d of districts) {
    for (const m of modules) {
      const key = `ftp:${d}:${m}`;
      await redis.del(key);
      console.log(`✓ Deleted cache key: ${key}`);
    }
  }
  console.log("\nCache cleared. Next API request will hit the DB.");
}

main().catch((e) => { console.error(e); process.exit(1); });
