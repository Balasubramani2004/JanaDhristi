/**
 * ForThePeople.in — Admin Settings Helper
 * Key-value settings stored in AdminSetting table.
 */

import { prisma } from "@/lib/db";

export async function getAdminSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.adminSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

export async function setAdminSetting(key: string, value: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function isAutoClassifyEnabled(): Promise<boolean> {
  const val = await getAdminSetting("feedback_auto_classify");
  return val === "true";
}
