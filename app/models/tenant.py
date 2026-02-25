from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.db.session import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str] = mapped_column(String(50), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Optional link to a designated unit (by id)
    preferred_unit_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    leases: Mapped[List["Lease"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    notifications: Mapped[List["NotificationLog"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
