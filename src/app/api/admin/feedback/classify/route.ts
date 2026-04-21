import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { batchClassifyFeedback } from "@/lib/feedback-classifier";

const COOKIE = "ftp_admin_v1";

export async function POST() {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await batchClassifyFeedback();
  return NextResponse.json(result);
}
