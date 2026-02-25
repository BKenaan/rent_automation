from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SQLEnum, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Any
from app.db.session import Base
from app.models.enums import NotificationType, NotificationChannel

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    lease_id: Mapped[int] = mapped_column(ForeignKey("leases.id", ondelete="CASCADE"), index=True)
    payment_schedule_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("payment_schedules.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    type: Mapped[NotificationType] = mapped_column(SQLEnum(NotificationType))
    channel: Mapped[NotificationChannel] = mapped_column(SQLEnum(NotificationChannel), default=NotificationChannel.WHATSAPP)
    triggered_on: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    payload_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="notifications")
    lease: Mapped["Lease"] = relationship(back_populates="notifications")
    payment_schedule: Mapped[Optional["PaymentSchedule"]] = relationship(back_populates="notifications")
