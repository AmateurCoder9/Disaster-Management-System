"""ML prediction route – score grids via the trained model."""

from flask import Blueprint, request, jsonify

from app import db
from app.models.grid import Grid
from app.ml.predictor import predict_priority
from app.routes.auth import token_required

predict_bp = Blueprint("predict", __name__)


def _score_grid(grid: Grid) -> dict:
    """Run prediction on a single grid, persist result, return updated dict."""
    severity = grid.severity or 3
    population = grid.population or 1000
    accessibility = grid.accessibility or 3

    score = predict_priority(severity, population, accessibility)
    grid.ai_priority_score = round(score, 2)

    # Derive risk level from score
    if score > 75:
        grid.risk_level = "critical"
    elif score > 50:
        grid.risk_level = "high"
    elif score > 25:
        grid.risk_level = "medium"
    else:
        grid.risk_level = "low"

    return grid.to_dict()


@predict_bp.route("/predict-priority", methods=["POST"])
@token_required
def predict():
    """Score one or many grids.

    Body options:
      {"grid_id": 1}              – score a single grid
      {"grid_ids": [1, 2, 3]}     – batch-score multiple grids
    """
    data = request.get_json(silent=True) or {}

    # ── Single grid ──────────────────────────────────────────────────────
    grid_id = data.get("grid_id")
    grid_ids = data.get("grid_ids")

    if grid_id is not None:
        grid = db.session.get(Grid, int(grid_id))
        if grid is None:
            return jsonify({"error": "Grid not found"}), 404
        result = _score_grid(grid)
        db.session.commit()
        return jsonify({"grid": result}), 200

    # ── Batch ────────────────────────────────────────────────────────────
    if grid_ids is not None and isinstance(grid_ids, list):
        results = []
        for gid in grid_ids:
            grid = db.session.get(Grid, int(gid))
            if grid is None:
                results.append({"id": gid, "error": "Grid not found"})
                continue
            results.append(_score_grid(grid))
        db.session.commit()
        return jsonify({"grids": results}), 200

    return jsonify({"error": "Provide grid_id or grid_ids"}), 400
