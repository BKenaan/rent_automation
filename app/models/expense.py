from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.db.session import Base

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), index=True)
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    category: Mapped[str] = mapped_column(String(100), index=True) # e.g., Maintenance, Tax, Utility
    date: Mapped[date] = mapped_column(Date, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    unit: Mapped["Unit"] = relationship(back_populates="expenses")
