# Krishi AI Showcase Pack

Use this folder for demo and judge presentation assets.

## Dataset location

Put your dataset files in:

- `showcase/krishi-ai/datasets/`

Required file for training:

- `showcase/krishi-ai/datasets/krishi-training-samples.json`

## Commands

- Export generated samples:
  - `npm run showcase:export-datasets`
- Train XGBoost model from showcase dataset:
  - `npm run showcase:train-model`

## Model artifact output

- `showcase/krishi-ai/model-artifacts/xgboost-harvest.json`
- `showcase/krishi-ai/model-artifacts/xgboost-sell.json`
- `showcase/krishi-ai/model-artifacts/xgboost-metadata.json`
