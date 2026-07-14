"""Assignment model – maps a response team to a grid sector."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    team_name: Mapped[str] = mapped_column(String(100), nullable=False)
    grid_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("grids.id"), nullable=False
    )
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assigned_time: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    # ── Relationships ────────────────────────────────────────────────────
    grid = relationship("Grid", back_populates="assignments")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "team_name": self.team_name,
            "grid_id": self.grid_id,
            "priority": self.priority,
            "assigned_time": (
                self.assigned_time.isoformat() if self.assigned_time else None
            ),
            "status": self.status,
        }
