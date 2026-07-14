"""Application configuration loaded from environment variables."""

import os


class Config:
    """Base configuration."""

    # ── JWT ──────────────────────────────────────────────────────────────
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
    if JWT_SECRET == "dev-secret-change-in-production":
        print(
            "\n⚠️  WARNING: Using default JWT_SECRET. "
            "Set the JWT_SECRET environment variable before deploying!\n"
        )

    # ── Database ─────────────────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL", "sqlite:///disaster.db"
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = "100/hour"
    RATE_LIMIT_SOS: str = "5/minute"
