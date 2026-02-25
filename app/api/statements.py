from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.models.tenant import Tenant as TenantModel
from app.models.lease import Lease as LeaseModel
from app.models.payment_schedule import PaymentSchedule as PaymentScheduleModel
from app.schemas.statement import TenantStatement, StatementTransaction
from app.utils.pdf_gen import generate_statement_pdf
import io

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/statements", tags=["statements"])

@router.get("/{tenant_id}", response_model=TenantStatement)
def get_tenant_statement(
    tenant_id: int, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Ideally a tenant has one active lease, but we'll sum across all
    leases = db.query(LeaseModel).filter(LeaseModel.tenant_id == tenant_id).all()
    
    total_due = 0.0
    total_paid = 0.0
    transactions = []
    unit_names = []
    
    for lease in leases:
        unit_names.append(lease.unit.name)
        schedules = db.query(PaymentScheduleModel).filter(PaymentScheduleModel.lease_id == lease.id).order_by(PaymentScheduleModel.due_date.asc()).all()
        for s in schedules:
            total_due += float(s.amount)
            if s.status == "paid":
                total_paid += float(s.amount)
            
            transactions.append(StatementTransaction(
                date=s.due_date,
                description=f"Rent - {lease.unit.name}",
                amount=float(s.amount),
                status=s.status.value
            ))
            
    balance = total_due - total_paid
    
    return TenantStatement(
        tenant_name=tenant.full_name,
        unit_name=", ".join(list(set(unit_names))) or "N/A",
        total_due=total_due,
        total_paid=total_paid,
        balance=balance,
        transactions=transactions
    )

@router.get("/{tenant_id}/download")
def download_tenant_statement(tenant_id: int, db: Session = Depends(get_db)):
    statement = get_tenant_statement(tenant_id, db)
    
    pdf_buffer = generate_statement_pdf(
        tenant_name=statement.tenant_name,
        unit_name=statement.unit_name,
        total_due=statement.total_due,
        total_paid=statement.total_paid,
        balance=statement.balance,
        transactions=[t.model_dump() for t in statement.transactions]
    )
    
    filename = f"Statement_{statement.tenant_name.replace(' ', '_')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
