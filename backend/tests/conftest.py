"""Shared pytest fixtures."""

import os
import sys

import pytest

# Ensure the backend package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir)))

from app import create_app, db as _db
from app.models.user import User  # noqa: F401 – register table

# ── Generate synthetic data & train model once (fast – 1000 rows) ────────
from data.generate_synthetic_data import generate as _generate_data
from app.ml.train_model import train as _train_model


def pytest_configure(config):
    """Run data generation + model training once per test session."""
    _generate_data()
    _train_model()


# ═══════════════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="session")
def app():
    """Create a test Flask application with an in-memory SQLite DB."""
    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///test.db",
        "JWT_SECRET": "test-secret-key-do-not-use",
    }
    application = create_app(test_config)
    yield application


@pytest.fixture(autouse=True)
def init_db(app):
    """Create tables before each test, drop after."""
    with app.app_context():
        _db.create_all()
        yield
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    """Register + login a dispatcher; return auth headers."""
    client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "dispatcher",
    })
    resp = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client):
    """Register + login an admin; return auth headers."""
    client.post("/auth/register", json={
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "adminpass123",
        "role": "admin",
    })
    resp = client.post("/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123",
    })
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}
