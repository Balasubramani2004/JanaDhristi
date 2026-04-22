import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";

type TrainingSample = {
  districtSlug: string;
  districtName: string;
  date: string;
  commodity: string;
  modalPrice: number;
  medianPrice7d: number;
  priceDeltaPct: number;
  rainfallMm: number;
  damStoragePct: number;
  activeOutages: number;
  advisoryCount7d: number;
  harvestLabel: "harvest_now" | "harvest_wait";
  sellLabel: "sell_now" | "sell_wait";
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const outDir = path.join(process.cwd(), "showcase", "krishi-ai", "datasets");
  await mkdir(outDir, { recursive: true });

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const districtMeta = districts.map((d) => ({
    districtId: d.id,
    districtSlug: d.slug,
    districtName: d.name,
    stateSlug: d.state.slug,
    stateName: d.state.name,
  }));
  await writeFile(path.join(outDir, "districts.json"), JSON.stringify(districtMeta, null, 2), "utf-8");

  const allSamples: TrainingSample[] = [];
  for (const district of districts) {
    const [cropRows, weatherRows, rainRows, damRows, outageRows, advisoryRows] = await Promise.all([
      prisma.cropPrice.findMany({
        where: { districtId: district.id },
        select: { commodity: true, modalPrice: true, date: true },
        orderBy: { date: "desc" },
        take: 300,
      }),
      prisma.weatherReading.findMany({
        where: { districtId: district.id },
        select: { recordedAt: true, rainfall: true },
        orderBy: { recordedAt: "desc" },
        take: 120,
      }),
      prisma.rainfallHistory.findMany({
        where: { districtId: district.id },
        select: { year: true, month: true, rainfall: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 12,
      }),
      prisma.damReading.findMany({
        where: { districtId: district.id },
        select: { recordedAt: true, storagePct: true },
        orderBy: { recordedAt: "desc" },
        take: 120,
      }),
      prisma.powerOutage.findMany({
        where: { districtId: district.id, active: true },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.agriAdvisory.findMany({
        where: { districtId: district.id },
        select: { weekOf: true, crop: true, advisory: true },
        orderBy: { weekOf: "desc" },
        take: 100,
      }),
    ]);

    const weather7d = weatherRows.filter((w) => Date.now() - w.recordedAt.getTime() <= 7 * 24 * 3600 * 1000);
    const rainfallMm =
      weather7d.length > 0
        ? weather7d.reduce((sum, row) => sum + (row.rainfall ?? 0), 0) / weather7d.length
        : rainRows.slice(0, 1).reduce((sum, row) => sum + row.rainfall, 0);

    const dam7d = damRows.filter((d) => Date.now() - d.recordedAt.getTime() <= 7 * 24 * 3600 * 1000);
    const damStoragePct =
      dam7d.length > 0 ? dam7d.reduce((sum, row) => sum + row.storagePct, 0) / dam7d.length : 0;

    const activeOutages7d = outageRows.filter((o) => Date.now() - o.createdAt.getTime() <= 7 * 24 * 3600 * 1000).length;
    const advisoryCount7d = advisoryRows.filter((a) => Date.now() - a.weekOf.getTime() <= 7 * 24 * 3600 * 1000).length;

    const byCommodity = new Map<string, Array<{ modalPrice: number; date: Date }>>();
    for (const row of cropRows) {
      const bucket = byCommodity.get(row.commodity) ?? [];
      bucket.push({ modalPrice: row.modalPrice, date: row.date });
      byCommodity.set(row.commodity, bucket);
    }

    for (const [commodity, series] of byCommodity.entries()) {
      if (series.length < 2) continue;
      const sorted = [...series].sort((a, b) => b.date.getTime() - a.date.getTime());
      const recentWindow = sorted.slice(0, 7);
      const latest = recentWindow[0];
      const medianPrice7d = median(recentWindow.map((x) => x.modalPrice));
      const priceDeltaPct = medianPrice7d > 0 ? ((latest.modalPrice - medianPrice7d) / medianPrice7d) * 100 : 0;

      const harvestLabel: TrainingSample["harvestLabel"] =
        rainfallMm > 3 && damStoragePct > 35 ? "harvest_now" : "harvest_wait";
      const sellLabel: TrainingSample["sellLabel"] = priceDeltaPct >= 2 ? "sell_now" : "sell_wait";

      allSamples.push({
        districtSlug: district.slug,
        districtName: district.name,
        date: toDateOnly(latest.date),
        commodity,
        modalPrice: latest.modalPrice,
        medianPrice7d,
        priceDeltaPct: Number(priceDeltaPct.toFixed(3)),
        rainfallMm: Number(rainfallMm.toFixed(3)),
        damStoragePct: Number(damStoragePct.toFixed(3)),
        activeOutages: activeOutages7d,
        advisoryCount7d,
        harvestLabel,
        sellLabel,
      });
    }
  }

  await writeFile(path.join(outDir, "krishi-training-samples.json"), JSON.stringify(allSamples, null, 2), "utf-8");
  await writeFile(
    path.join(outDir, "feature-mapping.json"),
    JSON.stringify(
      {
        version: "1.0",
        features: [
          "modalPrice",
          "medianPrice7d",
          "priceDeltaPct",
          "rainfallMm",
          "damStoragePct",
          "activeOutages",
          "advisoryCount7d",
        ],
        labels: ["harvestLabel", "sellLabel"],
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`Exported ${allSamples.length} samples to ${outDir}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Failed to export showcase datasets:", error);
  await prisma.$disconnect();
  process.exit(1);
});
