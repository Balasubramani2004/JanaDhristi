# Krishi AI Showcase: Datasets, Mapping, Algorithm, Model

This document is the judge-facing technical explanation for JanaDhristi Krishi Copilot.

## 1) Data sources used in training/export

The showcase dataset export (`scripts/export-krishi-showcase-datasets.ts`) pulls from:

- `CropPrice` (commodity prices, date-wise)
- `WeatherReading` (rainfall signal)
- `RainfallHistory` (fallback rainfall baseline)
- `DamReading` (water storage percentage)
- `PowerOutage` (active infrastructure stress)
- `AgriAdvisory` (recent advisory activity)
- `District` / `Taluk` metadata

All data is district-linked and can be refreshed from live DB before demo.

## 2) Feature attributes (input vector)

For each commodity-window sample:

- `modalPrice`: latest mandi modal price
- `medianPrice7d`: 7-day median for stabilization baseline
- `priceDeltaPct`: price trend signal (`latest vs medianPrice7d`)
- `rainfallMm`: short-window rainfall signal
- `damStoragePct`: average storage level signal
- `activeOutages`: outage pressure count
- `advisoryCount7d`: recent advisory intensity

Target labels in demo dataset:

- `harvestLabel`: `harvest_now` or `harvest_wait`
- `sellLabel`: `sell_now` or `sell_wait`

## 3) Feature mapping logic

Mapping is designed for explainability:

- Price trend:
  - `priceDeltaPct = ((latestPrice - medianPrice7d) / medianPrice7d) * 100`
- Weather/water:
  - rainfall and dam storage are aggregated to short-term confidence features
- Infrastructure risk:
  - outages contribute to risk penalty in decision confidence
- Advisory density:
  - frequent advisories imply dynamic/aggressive local conditions

## 4) Algorithm used (showcase training code)

Training file: `showcase/krishi-ai/train_xgboost.py`

Algorithm type:

- **XGBoost binary classifiers** (two-task setup)
- Produces:
  - Harvest class: `harvest_now` vs `harvest_wait`
  - Sell class: `sell_now` vs `sell_wait`
- Stores:
  - model artifacts + metadata into:
    - `showcase/krishi-ai/model-artifacts/xgboost-harvest.json`
    - `showcase/krishi-ai/model-artifacts/xgboost-sell.json`
    - `showcase/krishi-ai/model-artifacts/xgboost-metadata.json`

Why this algorithm for judges:

- strong tabular-data performance
- robust non-linear feature interactions
- practical for small-to-medium structured district datasets
- retrainable quickly with latest district data

## 5) AI model used in the app

Live copilot endpoint: `src/app/api/ai/civic-copilot/route.ts`

Inference architecture:

- Step 1: assemble district context from real data tables
- Step 2: generate structured JSON response using `callAIJSON(...)`
- Step 3: normalize/guard fields (always safe output shape)
- Step 4: fallback to deterministic local model if AI call fails

Current AI stack:

- Provider routing through `src/lib/ai-provider.ts`
- Primary/fallback providers controlled by app settings/env
- Krishi prompt style optimized for:
  - harvest/sell timing
  - rainfall/water risk
  - actionable next-24-hour guidance

## 6) Judge demo script (recommended)

1. Export dataset
2. Show `feature-mapping.json`
3. Train model and open produced artifact
4. Ask Krishi Copilot a real question (harvest/sell)
5. Explain hybrid design:
   - "dataset-trained transparent scorer" + "live district AI response layer"

## 7) Commands

- Export datasets:
  - `npx tsx scripts/export-krishi-showcase-datasets.ts`
- Train demo model:
  - `python showcase/krishi-ai/train_xgboost.py`
