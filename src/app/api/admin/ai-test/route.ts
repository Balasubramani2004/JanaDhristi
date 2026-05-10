/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai-provider";
import { cookies } from "next/headers";

const COOKIE = "ftp_admin_v1";

export async function POST() {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const start = Date.now();
  try {
    const response = await callAI({
      systemPrompt: "You are a test assistant for JanaDhristi.",
      userPrompt: "Reply with exactly: {\"status\":\"ok\",\"message\":\"Connection successful\"}",
      purpose: "classify",
      jsonMode: true,
    });
    const durationMs = Date.now() - start;
    return NextResponse.json({
      success: true,
      provider: response.provider,
      model: response.model,
      usedFallback: response.usedFallback,
      durationMs,
      response: response.text.slice(0, 200),
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }, { status: 500 });
  }
}
