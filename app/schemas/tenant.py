from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class TenantBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    notes: Optional[str] = None
    # Optional link to a designated unit
    preferred_unit_id: Optional[int] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    notes: Optional[str] = None
    preferred_unit_id: Optional[int] = None


class Tenant(TenantBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
