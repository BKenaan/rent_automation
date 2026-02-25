from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, ForwardRef
from app.models.enums import LeaseStatus, PaymentStatus

class PaymentScheduleBase(BaseModel):
    due_date: date
    amount: float
    status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None

class PaymentSchedule(PaymentScheduleBase):
    id: int
    lease_id: int
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None

    class Config:
        from_attributes = True

class TenantMinimal(BaseModel):
    id: int
    full_name: str
    class Config:
        from_attributes = True

class UnitMinimal(BaseModel):
    id: int
    name: str
    unit_code: str
    class Config:
        from_attributes = True

class LeaseMinimal(BaseModel):
    id: int
    tenant: TenantMinimal
    unit: UnitMinimal
    class Config:
        from_attributes = True

class PaymentScheduleWithDetails(PaymentSchedule):
    lease: LeaseMinimal

class LeaseBase(BaseModel):
    tenant_id: int
    unit_id: int
    start_date: date
    end_date: date
    rent_amount: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=5)
    payment_frequency_months: int = Field(1, description="Frequency in months: 1, 3, 6, 12")
    deposit_amount: float = Field(0.0, ge=0)
    reminder_days_before: Optional[List[int]] = None
    overdue_days_after: Optional[List[int]] = None
    status: LeaseStatus = LeaseStatus.ACTIVE

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info: Any) -> date:
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("payment_frequency_months")
    @classmethod
    def validate_frequency(cls, v: int) -> int:
        if v not in {1, 3, 6, 12}:
            raise ValueError("payment_frequency_months must be in {1, 3, 6, 12}")
        return v

class LeaseCreate(LeaseBase):
    pass

class LeaseUpdate(BaseModel):
    tenant_id: Optional[int] = None
    unit_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rent_amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=5)
    payment_frequency_months: Optional[int] = None
    deposit_amount: Optional[float] = Field(None, ge=0)
    reminder_days_before: Optional[List[int]] = None
    overdue_days_after: Optional[List[int]] = None
    status: Optional[LeaseStatus] = None

    @field_validator("payment_frequency_months")
    @classmethod
    def validate_frequency(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v not in {1, 3, 6, 12}:
            raise ValueError("payment_frequency_months must be in {1, 3, 6, 12}")
        return v

class Lease(LeaseBase):
    id: int
    created_at: datetime
    payment_schedules: List[PaymentSchedule] = []

    class Config:
        from_attributes = True
