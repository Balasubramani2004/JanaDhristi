import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";

const DEFAULT_TEMPLATES: Record<string, string> = {
  feedback_template_bug: "Thank you for reporting this! Our team has logged it and will investigate within 48 hours. The fix will appear in our Update Log on the district page.",
  feedback_template_feature: "Great suggestion! We've added this to our feature backlog. Follow our Update Log for progress updates.",
  feedback_template_data_error: "Thank you for flagging this! Data accuracy is critical to us. We will verify against official government sources and correct within 24-48 hours.",
  feedback_template_partnership: "Thank you for your interest in contributing! We'd love to connect. Please email us at support@janadhristi.in or visit https://github.com/Balasubramani2004/JanaDhristi",
};

export async function GET() {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try DB first, fall back to defaults
  const dbTemplates = await prisma.adminSetting.findMany({
    where: { key: { startsWith: "feedback_template_" } },
  });

  const templates: Record<string, string> = { ...DEFAULT_TEMPLATES };
  for (const t of dbTemplates) {
    templates[t.key] = t.value;
  }

  return NextResponse.json({
    templates: Object.entries(templates).map(([key, value]) => ({
      key,
      label: key.replace("feedback_template_", "").replace(/_/g, " "),
      value,
    })),
  });
}
