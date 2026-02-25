from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class StatementTransaction(BaseModel):
    date: date
    description: str
    amount: float
    status: str

class TenantStatement(BaseModel):
    tenant_name: str
    unit_name: str
    total_due: float
    total_paid: float
    balance: float
    transactions: List[StatementTransaction]
