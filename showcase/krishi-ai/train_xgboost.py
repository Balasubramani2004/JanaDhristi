import json
from pathlib import Path

from xgboost import XGBClassifier


ROOT = Path(__file__).resolve().parent
DATASET_PATH = ROOT / "datasets" / "krishi-training-samples.json"
MODEL_DIR = ROOT / "model-artifacts"
HARVEST_MODEL_PATH = MODEL_DIR / "xgboost-harvest.json"
SELL_MODEL_PATH = MODEL_DIR / "xgboost-sell.json"
META_PATH = MODEL_DIR / "xgboost-metadata.json"

FEATURES = [
    "priceDeltaPct",
    "rainfallMm",
    "damStoragePct",
    "activeOutages",
    "advisoryCount7d",
]


def row_to_features(row: dict) -> list[float]:
    return [float(row.get(k, 0.0) or 0.0) for k in FEATURES]


def train_binary(samples: list[dict], label_key: str, positive_label: str):
    x = [row_to_features(r) for r in samples]
    y = [1 if r.get(label_key) == positive_label else 0 for r in samples]

    model = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(x, y)

    preds = model.predict(x)
    correct = sum(int(a == b) for a, b in zip(preds, y))
    acc = correct / len(y) if y else 0.0
    return model, acc


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    samples = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    if not isinstance(samples, list) or len(samples) == 0:
        raise ValueError("Dataset is empty or invalid")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    harvest_model, harvest_acc = train_binary(samples, "harvestLabel", "harvest_now")
    sell_model, sell_acc = train_binary(samples, "sellLabel", "sell_now")

    harvest_model.save_model(str(HARVEST_MODEL_PATH))
    sell_model.save_model(str(SELL_MODEL_PATH))

    metadata = {
        "modelName": "JanaDhristi District Intelligence (dataset-trained)",
        "modelType": "xgboost-binary-classifiers",
        "trainedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "featureOrder": FEATURES,
        "metrics": {
            "harvestAccuracy": round(float(harvest_acc), 4),
            "sellAccuracy": round(float(sell_acc), 4),
            "sampleCount": len(samples),
        },
        "artifacts": {
            "harvestModel": HARVEST_MODEL_PATH.name,
            "sellModel": SELL_MODEL_PATH.name,
        },
    }
    META_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved: {HARVEST_MODEL_PATH}")
    print(f"Saved: {SELL_MODEL_PATH}")
    print(f"Saved: {META_PATH}")


if __name__ == "__main__":
    main()
