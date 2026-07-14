"""Grid CRUD routes."""

from flask import Blueprint, request, jsonify

from app import db
from app.models.grid import Grid
from app.models.disaster import Disaster
from app.routes.auth import token_required, role_required

grids_bp = Blueprint("grids", __name__, url_prefix="/grids")


@grids_bp.route("", methods=["GET"])
@token_required
def list_grids():
    """Return grids, optionally filtered by disaster_id."""
    query = db.session.query(Grid)

    disaster_id = request.args.get("disaster_id", type=int)
    if disaster_id is not None:
        query = query.filter_by(disaster_id=disaster_id)

    grids = query.all()
    return jsonify([g.to_dict() for g in grids]), 200


@grids_bp.route("", methods=["POST"])
@token_required
@role_required("admin", "dispatcher")
def create_grid():
    """Create a grid zone under a disaster."""
    data = request.get_json(silent=True) or {}

    disaster_id = data.get("disaster_id")
    grid_code = data.get("grid_code", "").strip()
    severity = data.get("severity")
    population = data.get("population")
    accessibility = data.get("accessibility")

    # ── Validation ───────────────────────────────────────────────────────
    if not disaster_id or not grid_code:
        return jsonify({"error": "disaster_id and grid_code are required"}), 400

    if db.session.get(Disaster, int(disaster_id)) is None:
        return jsonify({"error": "Disaster not found"}), 404

    if severity is not None and not (1 <= int(severity) <= 5):
        return jsonify({"error": "severity must be between 1 and 5"}), 400
    if accessibility is not None and not (1 <= int(accessibility) <= 5):
        return jsonify({"error": "accessibility must be between 1 and 5"}), 400
    if population is not None and int(population) < 0:
        return jsonify({"error": "population must be non-negative"}), 400

    grid = Grid(
        disaster_id=int(disaster_id),
        grid_code=grid_code,
        severity=int(severity) if severity is not None else None,
        population=int(population) if population is not None else None,
        accessibility=int(accessibility) if accessibility is not None else None,
    )
    db.session.add(grid)
    db.session.commit()
    return jsonify(grid.to_dict()), 201


@grids_bp.route("/<int:grid_id>", methods=["PUT"])
@token_required
@role_required("admin", "dispatcher")
def update_grid(grid_id: int):
    """Update grid fields."""
    grid = db.session.get(Grid, grid_id)
    if grid is None:
        return jsonify({"error": "Grid not found"}), 404

    data = request.get_json(silent=True) or {}

    if "grid_code" in data:
        grid.grid_code = data["grid_code"].strip()
    if "severity" in data:
        sev = int(data["severity"])
        if not 1 <= sev <= 5:
            return jsonify({"error": "severity must be between 1 and 5"}), 400
        grid.severity = sev
    if "population" in data:
        pop = int(data["population"])
        if pop < 0:
            return jsonify({"error": "population must be non-negative"}), 400
        grid.population = pop
    if "accessibility" in data:
        acc = int(data["accessibility"])
        if not 1 <= acc <= 5:
            return jsonify({"error": "accessibility must be between 1 and 5"}), 400
        grid.accessibility = acc
    if "risk_level" in data:
        rl = data["risk_level"].strip().lower()
        if rl not in ("critical", "high", "medium", "low"):
            return jsonify({"error": "risk_level must be critical, high, medium, or low"}), 400
        grid.risk_level = rl

    db.session.commit()
    return jsonify(grid.to_dict()), 200
