"""ML predictor – load the trained model and score grids."""

import logging
import os

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────
_BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), os.pardir, os.pardir)
)
_MODEL_PATH = os.path.join(_BACKEND_DIR, "trained_models", "model.pkl")

# ── Cached model singleton ──────────────────────────────────────────────
_model = None


def load_model():
    """Load model from disk (once). Returns the model or None."""
    global _model
    if _model is not None:
        return _model

    if not os.path.exists(_MODEL_PATH):
        logger.warning(
            "Model file not found at %s – predictions will use fallback formula.",
            _MODEL_PATH,
        )
        return None

    _model = joblib.load(_MODEL_PATH)
    logger.info("Loaded ML model from %s", _MODEL_PATH)
    return _model


def _clamp(value: float, lo: float = 1.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def predict_priority(severity: int, population: int, accessibility: int) -> float:
    """Return a priority score (1-100) for the given grid parameters.

    Uses the trained RandomForest when available; otherwise falls back to
    the same deterministic formula used to generate training data.
    """
    model = load_model()

    if model is not None:
        features = np.array([[severity, population, accessibility]])
        score = float(model.predict(features)[0])
    else:
        # Fallback: same formula as synthetic data generator (no noise)
        score = (severity * 20) + (population / 1000) + ((6 - accessibility) * 10)

    return _clamp(score)
