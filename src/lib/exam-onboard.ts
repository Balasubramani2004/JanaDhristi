/**
 * JanaDhristi — Exam onboarding for a newly activated district
 *
 * When a new district goes live, clone every NATIONAL scope exam already
 * held by any other active district, plus every STATE exam for this
 * district's state. The target district is identified by id.
 *
 * Fuzzy-safe: only clones exams that don't already exist on the target
 * (matched by shortName or title prefix).
 *
 * Use from an admin action or the district activation flow:
 *
 *   import { onboardDistrictExams } from "@/lib/exam-onboard";
 *   await onboardDistrictExams(districtId);
 */

import { Prisma } from "@/generated/prisma";
import { prisma } from "./db";
import { logUpdate } from "./update-log";

export interface OnboardResult {
  nationalCloned: number;
  stateCloned: number;
  skipped: number;
}

export async function onboardDistrictExams(districtId: string): Promise<OnboardResult> {
  const target = await prisma.district.findUnique({
    where: { id: districtId },
    select: { id: true, name: true, slug: true, stateId: true, active: true },
  });
  if (!target) throw new Error(`District ${districtId} not found`);

  // ── NATIONAL exams ─────────────────────────────────────────
  // Dedupe by shortName when available, else by (title, organizingBody).
  const nationalDonors = await prisma.governmentExam.findMany({
    where: {
      OR: [{ scope: "NATIONAL" }, { level: "national" }],
      districtId: { not: districtId },
    },
    orderBy: { updatedAt: "desc" },
  });
  const seenNational = new Set<string>();
  const nationalUnique = nationalDonors.filter((e) => {
    const key = (e.shortName ?? e.title).toLowerCase().trim();
    if (seenNational.has(key)) return false;
    seenNational.add(key);
    return true;
  });

  // ── STATE exams in the target's state ──────────────────────
  const stateDonors = target.stateId
    ? await prisma.governmentExam.findMany({
        where: {
          stateId: target.stateId,
          OR: [{ scope: "STATE" }, { level: "state" }],
          districtId: { not: districtId },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];
  const seenState = new Set<string>();
  const stateUnique = stateDonors.filter((e) => {
    const key = (e.shortName ?? e.title).toLowerCase().trim();
    if (seenState.has(key)) return false;
    seenState.add(key);
    return true;
  });

  // ── Existing at target ─────────────────────────────────────
  const existing = await prisma.governmentExam.findMany({
    where: { districtId: target.id },
    select: { title: true, shortName: true },
  });
  const existingKeys = new Set(existing.map((r) => (r.shortName ?? r.title).toLowerCase().trim()));

  let nationalCloned = 0;
  let stateCloned = 0;
  let skipped = 0;

  const clone = async (
    donor: typeof nationalUnique[number],
    scopeOverride: "NATIONAL" | "STATE"
  ) => {
    const key = (donor.shortName ?? donor.title).toLowerCase().trim();
    if (existingKeys.has(key)) {
      skipped++;
      return false;
    }
    await prisma.governmentExam.create({
      data: {
        level: scopeOverride === "NATIONAL" ? "national" : "state",
        stateId: scopeOverride === "NATIONAL" ? null : target.stateId,
        districtId: target.id,
        title: donor.title,
        shortName: donor.shortName,
        department: donor.department,
        organizingBody: donor.organizingBody,
        category: donor.category,
        scope: scopeOverride,
        status: donor.status,
        vacancies: donor.vacancies,
        qualification: donor.qualification,
        ageLimit: donor.ageLimit,
        applicationFee: donor.applicationFee,
        selectionProcess: donor.selectionProcess,
        payScale: donor.payScale,
        applyUrl: donor.applyUrl,
        notificationUrl: donor.notificationUrl,
        syllabusUrl: donor.syllabusUrl,
        announcedDate: donor.announcedDate,
        notificationDate: donor.notificationDate,
        startDate: donor.startDate,
        endDate: donor.endDate,
        admitCardDate: donor.admitCardDate,
        examDate: donor.examDate,
        resultDate: donor.resultDate,
        sourceUrls: (donor.sourceUrls ?? []) as Prisma.InputJsonValue,
        lastVerifiedAt: donor.lastVerifiedAt,
        needsVerification: donor.needsVerification,
      },
    });
    existingKeys.add(key);
    return true;
  };

  for (const e of nationalUnique) if (await clone(e, "NATIONAL")) nationalCloned++;
  for (const e of stateUnique) if (await clone(e, "STATE")) stateCloned++;

  await logUpdate({
    source: "api",
    actorLabel: "onboard-script",
    tableName: "GovernmentExam",
    recordId: `${target.id}:onboard`,
    action: "create",
    districtId: target.id,
    districtName: target.name,
    moduleName: "exams",
    description: `Onboarded ${nationalCloned} national + ${stateCloned} state exams for ${target.name}`,
    recordCount: nationalCloned + stateCloned,
    details: { nationalCloned, stateCloned, skipped },
  });

  return { nationalCloned, stateCloned, skipped };
}
