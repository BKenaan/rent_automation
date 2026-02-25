from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from app.models.enums import UnitType

class UnitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str = Field(..., min_length=1, max_length=511)
    unit_code: str = Field(..., min_length=1, max_length=50)
    type: UnitType = UnitType.APARTMENT
    purchase_price: Optional[float] = Field(None, ge=0)
    target_yield: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, min_length=1, max_length=511)
    unit_code: Optional[str] = Field(None, min_length=1, max_length=50)
    type: Optional[UnitType] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    target_yield: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class Unit(UnitBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
