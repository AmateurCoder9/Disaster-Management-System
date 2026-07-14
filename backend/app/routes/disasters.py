"""Disaster CRUD routes."""

from flask import Blueprint, request, jsonify

from app import db
from app.models.disaster import Disaster
from app.routes.auth import token_required, role_required

disasters_bp = Blueprint("disasters", __name__, url_prefix="/disasters")

VALID_TYPES = {"earthquake", "flood", "wildfire", "hurricane", "tsunami", "other"}
VALID_STATUSES = {"active", "resolved", "monitoring"}


@disasters_bp.route("", methods=["GET"])
@token_required
def list_disasters():
    """Return all disasters."""
    disasters = db.session.query(Disaster).order_by(Disaster.created_at.desc()).all()
    return jsonify([d.to_dict() for d in disasters]), 200


@disasters_bp.route("", methods=["POST"])
@token_required
@role_required("admin")
def create_disaster():
    """Create a new disaster (admin only)."""
    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    disaster_type = data.get("disaster_type", "").strip().lower()
    description = data.get("description", "")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    severity = data.get("severity")
    radius = data.get("radius")

    # ── Validation ───────────────────────────────────────────────────────
    errors = []
    if not title:
        errors.append("title is required")
    if disaster_type not in VALID_TYPES:
        errors.append(f"disaster_type must be one of {sorted(VALID_TYPES)}")
    if latitude is None or longitude is None:
        errors.append("latitude and longitude are required")
    if severity is None or not (1 <= int(severity) <= 5):
        errors.append("severity must be between 1 and 5")
    if radius is None or float(radius) <= 0:
        errors.append("radius must be a positive number")
    if errors:
        return jsonify({"error": errors}), 400

    disaster = Disaster(
        title=title,
        disaster_type=disaster_type,
        description=description,
        latitude=float(latitude),
        longitude=float(longitude),
        severity=int(severity),
        radius=float(radius),
    )
    db.session.add(disaster)
    db.session.commit()
    return jsonify(disaster.to_dict()), 201


@disasters_bp.route("/<int:disaster_id>", methods=["PUT"])
@token_required
@role_required("admin", "dispatcher")
def update_disaster(disaster_id: int):
    """Update an existing disaster (admin or dispatcher)."""
    disaster = db.session.get(Disaster, disaster_id)
    if disaster is None:
        return jsonify({"error": "Disaster not found"}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        disaster.title = data["title"].strip()
    if "disaster_type" in data:
        dt = data["disaster_type"].strip().lower()
        if dt not in VALID_TYPES:
            return jsonify({"error": f"disaster_type must be one of {sorted(VALID_TYPES)}"}), 400
        disaster.disaster_type = dt
    if "description" in data:
        disaster.description = data["description"]
    if "latitude" in data:
        disaster.latitude = float(data["latitude"])
    if "longitude" in data:
        disaster.longitude = float(data["longitude"])
    if "severity" in data:
        sev = int(data["severity"])
        if not 1 <= sev <= 5:
            return jsonify({"error": "severity must be between 1 and 5"}), 400
        disaster.severity = sev
    if "radius" in data:
        r = float(data["radius"])
        if r <= 0:
            return jsonify({"error": "radius must be positive"}), 400
        disaster.radius = r
    if "status" in data:
        s = data["status"].strip().lower()
        if s not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400
        disaster.status = s

    db.session.commit()
    return jsonify(disaster.to_dict()), 200


@disasters_bp.route("/<int:disaster_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_disaster(disaster_id: int):
    """Delete a disaster and its child grids (admin only)."""
    disaster = db.session.get(Disaster, disaster_id)
    if disaster is None:
        return jsonify({"error": "Disaster not found"}), 404

    db.session.delete(disaster)
    db.session.commit()
    return jsonify({"message": f"Disaster {disaster_id} deleted"}), 200
