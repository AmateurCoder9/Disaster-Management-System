"""Assignment routes – map response teams to grid sectors."""

from flask import Blueprint, request, jsonify

from app import db
from app.models.assignment import Assignment
from app.models.grid import Grid
from app.routes.auth import token_required, role_required

assignments_bp = Blueprint("assignments", __name__)


@assignments_bp.route("/assign", methods=["POST"])
@token_required
@role_required("admin", "dispatcher")
def create_assignment():
    """Assign a team to a grid sector."""
    data = request.get_json(silent=True) or {}

    team_name = data.get("team_name", "").strip()
    grid_id = data.get("grid_id")
    priority = data.get("priority")

    if not team_name or grid_id is None:
        return jsonify({"error": "team_name and grid_id are required"}), 400

    if db.session.get(Grid, int(grid_id)) is None:
        return jsonify({"error": "Grid not found"}), 404

    assignment = Assignment(
        team_name=team_name,
        grid_id=int(grid_id),
        priority=int(priority) if priority is not None else None,
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify(assignment.to_dict()), 201


@assignments_bp.route("/assignments", methods=["GET"])
@token_required
def list_assignments():
    """List assignments with optional grid_id or disaster_id filter."""
    query = db.session.query(Assignment)

    grid_id = request.args.get("grid_id", type=int)
    disaster_id = request.args.get("disaster_id", type=int)

    if grid_id is not None:
        query = query.filter_by(grid_id=grid_id)
    elif disaster_id is not None:
        query = query.join(Grid).filter(Grid.disaster_id == disaster_id)

    assignments = query.all()
    return jsonify([a.to_dict() for a in assignments]), 200
