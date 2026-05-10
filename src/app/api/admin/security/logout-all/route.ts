/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "ftp_admin_v1";
const TOTP_PENDING = "admin_totp_pending";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(TOTP_PENDING);

  return NextResponse.json({ ok: true });
}
