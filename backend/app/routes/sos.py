"""SOS routes – public distress signal submission + authenticated management."""

from flask import Blueprint, request, jsonify

from app import db, limiter
from app.config import Config
from app.models.sos import SOSRequest
from app.routes.auth import token_required

sos_bp = Blueprint("sos", __name__)


@sos_bp.route("/sos", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_SOS)
def submit_sos():
    """PUBLIC endpoint – accept a distress signal. Rate-limited to 5/min/IP."""
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    message = data.get("message", "")

    if not name or latitude is None or longitude is None:
        return jsonify({"error": "name, latitude, and longitude are required"}), 400

    sos = SOSRequest(
        name=name,
        phone=phone or None,
        latitude=float(latitude),
        longitude=float(longitude),
        message=message,
    )
    db.session.add(sos)
    db.session.commit()

    # Return public dict only – no PII in response
    return jsonify({
        "message": "SOS request received",
        "sos": sos.to_public_dict(),
    }), 201


@sos_bp.route("/sos", methods=["GET"])
@token_required
def list_sos():
    """Authenticated – return all SOS requests with full details."""
    requests_list = (
        db.session.query(SOSRequest)
        .order_by(SOSRequest.created_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in requests_list]), 200


@sos_bp.route("/sos/<int:sos_id>/status", methods=["PUT"])
@token_required
def update_sos_status(sos_id: int):
    """Update an SOS request's status."""
    sos = db.session.get(SOSRequest, sos_id)
    if sos is None:
        return jsonify({"error": "SOS request not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip().lower()

    if new_status not in ("pending", "verified", "resolved"):
        return jsonify({"error": "status must be pending, verified, or resolved"}), 400

    sos.status = new_status
    db.session.commit()
    return jsonify(sos.to_dict()), 200
