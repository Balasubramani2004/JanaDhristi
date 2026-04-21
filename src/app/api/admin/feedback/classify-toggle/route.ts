import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAutoClassifyEnabled, setAdminSetting } from "@/lib/admin-settings";

const COOKIE = "ftp_admin_v1";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const enabled = await isAutoClassifyEnabled();
  return NextResponse.json({ enabled });
}

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const current = await isAutoClassifyEnabled();
  await setAdminSetting("feedback_auto_classify", current ? "false" : "true");
  return NextResponse.json({ enabled: !current });
}
