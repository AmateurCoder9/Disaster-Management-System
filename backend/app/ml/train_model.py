"""Train the disaster priority RandomForest model.

Run:  python -m app.ml.train_model        (from backend/)
  or: python app/ml/train_model.py
"""

import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

# ── Paths ────────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
DATA_PATH = os.path.join(BACKEND_DIR, "data", "synthetic_training_data.csv")
MODEL_DIR = os.path.join(BACKEND_DIR, "trained_models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")

FEATURES = ["severity", "population", "accessibility"]
TARGET = "priority_score"


def train() -> None:
    """Load data, train model, evaluate, and persist."""

    # ── Load ─────────────────────────────────────────────────────────────
    if not os.path.exists(DATA_PATH):
        print(f"Training data not found at {DATA_PATH}")
        print("Run  python data/generate_synthetic_data.py  first.")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows from {DATA_PATH}")

    X = df[FEATURES].values
    y = df[TARGET].values

    # ── Split ────────────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ── Train ────────────────────────────────────────────────────────────
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # ── Evaluate ─────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"  R² score : {r2:.4f}")
    print(f"  MAE      : {mae:.4f}")

    # ── Feature importance ───────────────────────────────────────────────
    importances = model.feature_importances_
    for feat, imp in zip(FEATURES, importances):
        print(f"  {feat:15s} importance = {imp:.4f}")

    # ── Save ─────────────────────────────────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved -> {MODEL_PATH}")


if __name__ == "__main__":
    train()
