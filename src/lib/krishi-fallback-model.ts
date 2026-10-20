import { readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

type WeightMap = Record<string, number>;

type KrishiModelArtifact = {
  modelName: string;
  modelType: string;
  trainedAt: string;
  inputFeatures: string[];
  harvestWeights: WeightMap;
  sellWeights: WeightMap;
  threshold: number;
  metrics?: {
    harvestAccuracy?: number;
    sellAccuracy?: number;
    sampleCount?: number;
  };
};

export type KrishiFeatureInput = {
  priceDeltaPct: number;
  rainfallMm: number;
  damStoragePct: number;
  activeOutages: number;
  advisoryCount7d: number;
};

let cachedModel: KrishiModelArtifact | null = null;
let cacheLoaded = false;
const execFileAsync = promisify(execFile);

function safeNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function score(features: KrishiFeatureInput, weights: WeightMap): number {
  return (
    features.priceDeltaPct * safeNumber(weights.priceDeltaPct) +
    features.rainfallMm * safeNumber(weights.rainfallMm) +
    features.damStoragePct * safeNumber(weights.damStoragePct) +
    features.activeOutages * safeNumber(weights.activeOutages) +
    features.advisoryCount7d * safeNumber(weights.advisoryCount7d)
  );
}

function scoreToConfidence(raw: number): number {
  // Smooth confidence conversion for readable UI confidence values.
  const normalized = 1 / (1 + Math.exp(-raw / 8));
  return Math.min(0.95, Math.max(0.05, normalized));
}

export async function loadKrishiFallbackModel(): Promise<KrishiModelArtifact | null> {
  if (cacheLoaded) return cachedModel;
  cacheLoaded = true;

  try {
    const modelPath = path.join(process.cwd(), "showcase", "krishi-ai", "model-artifacts", "krishi-risk-model.json");
    const raw = await readFile(modelPath, "utf-8");
    const parsed = JSON.parse(raw) as KrishiModelArtifact;
    if (!parsed?.harvestWeights || !parsed?.sellWeights) return null;
    cachedModel = parsed;
    return parsed;
  } catch {
    cachedModel = null;
    return null;
  }
}

export async function predictKrishiDecisions(features: KrishiFeatureInput) {
  // Prefer XGBoost predictor when model artifacts exist.
  try {
    const scriptPath = path.join(process.cwd(), "showcase", "krishi-ai", "predict_xgboost.py");
    const { stdout } = await execFileAsync("python", [scriptPath, JSON.stringify(features)], { timeout: 5000 });
    const parsed = JSON.parse(stdout || "{}") as {
      ok?: boolean;
      modelName?: string;
      harvest?: { label?: "harvest_now" | "harvest_wait"; confidence?: number; probabilityNow?: number };
      sell?: { label?: "sell_now" | "sell_wait"; confidence?: number; probabilityNow?: number };
    };
    if (parsed.ok && parsed.harvest?.label && parsed.sell?.label) {
      return {
        modelName: parsed.modelName ?? "JanaDhristi District Intelligence (dataset-trained)",
        harvest: {
          score: typeof parsed.harvest.probabilityNow === "number" ? parsed.harvest.probabilityNow : 0,
          label: parsed.harvest.label,
          confidence: safeNumber(parsed.harvest.confidence),
        },
        sell: {
          score: typeof parsed.sell.probabilityNow === "number" ? parsed.sell.probabilityNow : 0,
          label: parsed.sell.label,
          confidence: safeNumber(parsed.sell.confidence),
        },
      };
    }
  } catch {
    // Silent fallback to JSON linear artifact mode.
  }

  const model = await loadKrishiFallbackModel();
  if (!model) return null;

  const threshold = safeNumber(model.threshold);
  const harvestScore = score(features, model.harvestWeights);
  const sellScore = score(features, model.sellWeights);

  return {
    modelName: model.modelName,
    harvest: {
      score: harvestScore,
      label: harvestScore >= threshold ? "harvest_now" : "harvest_wait",
      confidence: scoreToConfidence(harvestScore),
    },
    sell: {
      score: sellScore,
      label: sellScore >= threshold ? "sell_now" : "sell_wait",
      confidence: scoreToConfidence(sellScore),
    },
  };
}
