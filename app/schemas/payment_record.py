from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class PaymentRecord(BaseModel):
    payment_method: str = Field(..., min_length=1, max_length=100)
    reference: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    paid_at: Optional[datetime] = Field(default_factory=datetime.now)

class PaymentStatusUpdate(BaseModel):
    status: str # pending, paid, overdue
