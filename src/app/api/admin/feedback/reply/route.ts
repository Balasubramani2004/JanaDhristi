import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { replyToFeedback } from "@/lib/feedback-reply";

const COOKIE = "ftp_admin_v1";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { feedbackId, replyText, sendEmail } = await req.json();
  if (!feedbackId || !replyText) {
    return NextResponse.json({ error: "feedbackId and replyText required" }, { status: 400 });
  }

  const result = await replyToFeedback(feedbackId, replyText, sendEmail ?? false);
  return NextResponse.json(result);
}
