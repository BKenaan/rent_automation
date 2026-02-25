from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, Enum as SQLEnum, ForeignKey, Numeric, JSON, Integer, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Any
from app.db.session import Base
from app.models.enums import LeaseStatus

class Lease(Base):
    __tablename__ = "leases"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), index=True)
    
    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date] = mapped_column(Date, index=True)
    rent_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(5), default="USD")
    payment_frequency_months: Mapped[int] = mapped_column(Integer, default=1)
    deposit_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    
    reminder_days_before: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True) # e.g., [1, 3, 5]
    overdue_days_after: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True) # e.g., [1, 3, 7]
    
    status: Mapped[LeaseStatus] = mapped_column(SQLEnum(LeaseStatus), default=LeaseStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="leases")
    unit: Mapped["Unit"] = relationship(back_populates="leases")
    payment_schedules: Mapped[List["PaymentSchedule"]] = relationship(back_populates="lease", cascade="all, delete-orphan")
    notifications: Mapped[List["NotificationLog"]] = relationship(back_populates="lease", cascade="all, delete-orphan")
