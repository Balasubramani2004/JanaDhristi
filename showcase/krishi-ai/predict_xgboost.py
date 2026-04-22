import json
import sys
from pathlib import Path

from xgboost import XGBClassifier


ROOT = Path(__file__).resolve().parent
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


def fail(msg: str):
    print(json.dumps({"ok": False, "error": msg}))
    sys.exit(0)


def main():
    if len(sys.argv) < 2:
        fail("Missing feature payload argument")
    if not HARVEST_MODEL_PATH.exists() or not SELL_MODEL_PATH.exists():
        fail("XGBoost model artifacts not found")

    try:
        payload = json.loads(sys.argv[1])
    except Exception:
        fail("Invalid feature payload JSON")

    vec = [[float(payload.get(k, 0.0) or 0.0) for k in FEATURES]]

    harvest_model = XGBClassifier()
    sell_model = XGBClassifier()
    harvest_model.load_model(str(HARVEST_MODEL_PATH))
    sell_model.load_model(str(SELL_MODEL_PATH))

    h_prob = float(harvest_model.predict_proba(vec)[0][1])
    s_prob = float(sell_model.predict_proba(vec)[0][1])

    model_name = "JanaDhristi District Intelligence (dataset-trained)"
    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text(encoding="utf-8"))
            model_name = str(meta.get("modelName") or model_name)
        except Exception:
            pass

    print(
        json.dumps(
            {
                "ok": True,
                "modelName": model_name,
                "harvest": {
                    "label": "harvest_now" if h_prob >= 0.5 else "harvest_wait",
                    "confidence": h_prob if h_prob >= 0.5 else 1.0 - h_prob,
                    "probabilityNow": h_prob,
                },
                "sell": {
                    "label": "sell_now" if s_prob >= 0.5 else "sell_wait",
                    "confidence": s_prob if s_prob >= 0.5 else 1.0 - s_prob,
                    "probabilityNow": s_prob,
                },
            }
        )
    )


if __name__ == "__main__":
    main()
