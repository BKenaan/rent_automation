from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, Enum as SQLEnum, ForeignKey, Numeric, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.db.session import Base
from app.models.enums import PaymentStatus

class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    lease_id: Mapped[int] = mapped_column(ForeignKey("leases.id", ondelete="CASCADE"), index=True)
    
    due_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    lease: Mapped["Lease"] = relationship(back_populates="payment_schedules")
    notifications: Mapped[Optional["NotificationLog"]] = relationship(back_populates="payment_schedule")
