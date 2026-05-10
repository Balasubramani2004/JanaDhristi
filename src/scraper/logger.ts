/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Scraper logger + DB log writer
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { ScraperResult } from "./types";

export function makeLogger(jobName: string) {
  const lines: string[] = [];
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] [${jobName}] ${msg}`;
    console.log(line);
    lines.push(line);
  };
  return { log, lines };
}

export async function writeLog(
  jobName: string,
  startedAt: Date,
  result: ScraperResult
) {
  try {
    await prisma.scraperLog.create({
      data: {
        jobName,
        status: result.success ? "success" : "error",
        recordsNew: result.recordsNew,
        recordsUpdated: result.recordsUpdated,
        error: result.error ?? null,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      },
    });
  } catch (e) {
    console.error("[ScraperLogger] Failed to write log:", e);
  }
}
