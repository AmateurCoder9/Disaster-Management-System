"""Flask application factory."""

from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

# ── Extensions (importable from `app`) ───────────────────────────────────
db = SQLAlchemy()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[Config.RATE_LIMIT_DEFAULT],
    storage_uri="memory://",
)


def create_app(test_config: dict | None = None) -> Flask:
    """Create and configure the Flask application."""
    application = Flask(__name__)

    # ── Configuration ────────────────────────────────────────────────────
    application.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI
    application.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    application.config["JWT_SECRET"] = Config.JWT_SECRET

    if test_config:
        application.config.update(test_config)

    # ── Initialise extensions ────────────────────────────────────────────
    db.init_app(application)
    CORS(application, origins=Config.CORS_ORIGINS if not test_config else ["*"])
    limiter.init_app(application)

    # ── Register blueprints ──────────────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.disasters import disasters_bp
    from app.routes.grids import grids_bp
    from app.routes.assignments import assignments_bp
    from app.routes.sos import sos_bp
    from app.routes.predict import predict_bp
    from app.routes.health import health_bp

    application.register_blueprint(auth_bp)
    application.register_blueprint(disasters_bp)
    application.register_blueprint(grids_bp)
    application.register_blueprint(assignments_bp)
    application.register_blueprint(sos_bp)
    application.register_blueprint(predict_bp)
    application.register_blueprint(health_bp)

    # ── Import models so tables are known to SQLAlchemy ──────────────────
    with application.app_context():
        import app.models  # noqa: F401

    return application
