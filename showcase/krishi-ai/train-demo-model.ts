import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type TrainingSample = {
  priceDeltaPct: number;
  rainfallMm: number;
  damStoragePct: number;
  activeOutages: number;
  advisoryCount7d: number;
  harvestLabel: "harvest_now" | "harvest_wait";
  sellLabel: "sell_now" | "sell_wait";
};

type DemoModelArtifact = {
  modelName: string;
  modelType: string;
  trainedAt: string;
  inputFeatures: string[];
  harvestWeights: Record<string, number>;
  sellWeights: Record<string, number>;
  threshold: number;
  metrics: {
    harvestAccuracy: number;
    sellAccuracy: number;
    sampleCount: number;
  };
};

function score(sample: TrainingSample, weights: Record<string, number>): number {
  return (
    sample.priceDeltaPct * weights.priceDeltaPct +
    sample.rainfallMm * weights.rainfallMm +
    sample.damStoragePct * weights.damStoragePct +
    sample.activeOutages * weights.activeOutages +
    sample.advisoryCount7d * weights.advisoryCount7d
  );
}

function accuracy(
  samples: TrainingSample[],
  weights: Record<string, number>,
  task: "harvest" | "sell",
  threshold: number
): number {
  if (samples.length === 0) return 0;
  let correct = 0;
  for (const sample of samples) {
    const pred = score(sample, weights) >= threshold;
    const actual = task === "harvest" ? sample.harvestLabel === "harvest_now" : sample.sellLabel === "sell_now";
    if (pred === actual) correct += 1;
  }
  return correct / samples.length;
}

function deriveSimpleWeights(samples: TrainingSample[], task: "harvest" | "sell"): Record<string, number> {
  const positives = samples.filter((s) => (task === "harvest" ? s.harvestLabel === "harvest_now" : s.sellLabel === "sell_now"));
  const negatives = samples.filter((s) => (task === "harvest" ? s.harvestLabel === "harvest_wait" : s.sellLabel === "sell_wait"));

  const mean = (rows: TrainingSample[], key: keyof TrainingSample) =>
    rows.length > 0 ? rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length : 0;

  return {
    priceDeltaPct: mean(positives, "priceDeltaPct") - mean(negatives, "priceDeltaPct"),
    rainfallMm: mean(positives, "rainfallMm") - mean(negatives, "rainfallMm"),
    damStoragePct: mean(positives, "damStoragePct") - mean(negatives, "damStoragePct"),
    activeOutages: mean(positives, "activeOutages") - mean(negatives, "activeOutages"),
    advisoryCount7d: mean(positives, "advisoryCount7d") - mean(negatives, "advisoryCount7d"),
  };
}

async function main() {
  const root = path.join(process.cwd(), "showcase", "krishi-ai");
  const datasetPath = path.join(root, "datasets", "krishi-training-samples.json");
  const modelDir = path.join(root, "model-artifacts");
  const modelPath = path.join(modelDir, "krishi-risk-model.json");

  const raw = await readFile(datasetPath, "utf-8");
  const samples = JSON.parse(raw) as TrainingSample[];
  if (samples.length === 0) throw new Error("No samples found in showcase dataset.");

  const harvestWeights = deriveSimpleWeights(samples, "harvest");
  const sellWeights = deriveSimpleWeights(samples, "sell");
  const threshold = 0;

  const artifact: DemoModelArtifact = {
    modelName: "JanaDhristi-Krishi-Risk-Demo-v1",
    modelType: "weighted-linear-scorer",
    trainedAt: new Date().toISOString(),
    inputFeatures: ["priceDeltaPct", "rainfallMm", "damStoragePct", "activeOutages", "advisoryCount7d"],
    harvestWeights,
    sellWeights,
    threshold,
    metrics: {
      harvestAccuracy: Number(accuracy(samples, harvestWeights, "harvest", threshold).toFixed(4)),
      sellAccuracy: Number(accuracy(samples, sellWeights, "sell", threshold).toFixed(4)),
      sampleCount: samples.length,
    },
  };

  await mkdir(modelDir, { recursive: true });
  await writeFile(modelPath, JSON.stringify(artifact, null, 2), "utf-8");
  console.log(`Saved model artifact: ${modelPath}`);
}

main().catch((error) => {
  console.error("Training failed:", error);
  process.exit(1);
});
