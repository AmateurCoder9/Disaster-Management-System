"""Health-check endpoint."""

from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text

from app import db

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """Return service health and verify DB connectivity."""
    status = "healthy"
    db_ok = True

    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
        status = "unhealthy"

    return jsonify({
        "status": status,
        "database": "connected" if db_ok else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200 if db_ok else 503
