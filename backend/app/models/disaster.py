"""Disaster model – represents a real-world disaster event."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Disaster(db.Model):
    __tablename__ = "disasters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    disaster_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)
    radius: Mapped[float] = mapped_column(Float, nullable=False)  # km
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ────────────────────────────────────────────────────
    grids = relationship("Grid", back_populates="disaster", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "disaster_type": self.disaster_type,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "severity": self.severity,
            "radius": self.radius,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
