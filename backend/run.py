"""Application entry point.

Usage:
    python run.py                       – dev server
    gunicorn run:app --bind 0.0.0.0:5000  – production (Linux / Docker)
"""

import os

from dotenv import load_dotenv

load_dotenv()

from app import create_app, db
from app.seed import seed_database
from app.models.user import User  # noqa: F401 – ensure table is registered

app = create_app()

with app.app_context():
    # ── Create all tables ────────────────────────────────────────────────
    import app.models  # noqa: F401
    db.create_all()

    # ── Seed if requested or if database is empty ────────────────────────
    should_seed = os.environ.get("SEED_DB", "").lower() == "true"
    if not should_seed:
        # Auto-seed when no users exist (fresh database)
        should_seed = db.session.query(User).first() is None

    if should_seed:
        seed_database(db)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=5000, debug=debug)
