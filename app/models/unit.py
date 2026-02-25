from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Numeric, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.db.session import Base
from app.models.enums import UnitType

class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    address: Mapped[str] = mapped_column(String(511))
    unit_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    type: Mapped[UnitType] = mapped_column(SQLEnum(UnitType), default=UnitType.APARTMENT)
    purchase_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    target_yield: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True) # e.g. 5.50 for 5.5%
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    leases: Mapped[List["Lease"]] = relationship(back_populates="unit", cascade="all, delete-orphan")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="unit", cascade="all, delete-orphan")
