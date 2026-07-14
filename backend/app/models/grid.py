"""Grid model – a sector/zone within a disaster area."""

from sqlalchemy import Integer, String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Grid(db.Model):
    __tablename__ = "grids"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    disaster_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("disasters.id"), nullable=False
    )
    grid_code: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    population: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accessibility: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_priority_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    # ── Relationships ────────────────────────────────────────────────────
    disaster = relationship("Disaster", back_populates="grids")
    assignments = relationship(
        "Assignment", back_populates="grid", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "disaster_id": self.disaster_id,
            "grid_code": self.grid_code,
            "severity": self.severity,
            "population": self.population,
            "accessibility": self.accessibility,
            "ai_priority_score": self.ai_priority_score,
            "risk_level": self.risk_level,
        }
