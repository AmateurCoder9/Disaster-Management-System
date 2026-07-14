"""Authentication routes and JWT helpers."""

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, request, jsonify, current_app

from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


# ═══════════════════════════════════════════════════════════════════════════
# JWT helpers
# ═══════════════════════════════════════════════════════════════════════════

def encode_token(user_id: int, role: str) -> str:
    """Create a signed JWT valid for 24 hours."""
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def _decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises jwt exceptions on failure."""
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])


# ═══════════════════════════════════════════════════════════════════════════
# Decorators
# ═══════════════════════════════════════════════════════════════════════════

def token_required(f):
    """Decorator that enforces a valid Bearer token on a route."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            data = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user = db.session.get(User, data["sub"])
        if user is None:
            return jsonify({"error": "User not found"}), 401

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


def role_required(*roles: str):
    """Decorator (use *after* token_required) to restrict by role."""

    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.current_user.role not in roles:
                return jsonify({"error": "Forbidden – insufficient role"}), 403
            return f(*args, **kwargs)

        return decorated

    return wrapper


# ═══════════════════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════════════════

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user. Accepts name, email, password, role."""
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "dispatcher").strip().lower()

    # ── Validation ───────────────────────────────────────────────────────
    if not name or not email or not password:
        return jsonify({"error": "name, email, and password are required"}), 400

    if role not in ("admin", "dispatcher"):
        return jsonify({"error": "role must be 'admin' or 'dispatcher'"}), 400

    if db.session.query(User).filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # ── Create user ──────────────────────────────────────────────────────
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = encode_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate with email + password, receive a JWT."""
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = db.session.query(User).filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = encode_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 200
