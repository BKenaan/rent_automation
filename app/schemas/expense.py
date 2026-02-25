from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional

class ExpenseBase(BaseModel):
    unit_id: int
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    date: date
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    unit_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    description: Optional[str] = None

class Expense(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
