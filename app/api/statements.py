import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.models.tenant import Tenant as TenantModel
from app.models.lease import Lease as LeaseModel
from app.models.payment_schedule import PaymentSchedule as PaymentScheduleModel
from app.schemas.statement import TenantStatement, StatementTransaction
from app.utils.pdf_gen import generate_statement_pdf
from app.api.deps import get_current_user
from app.models.user import User as UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/statements", tags=["statements"])


def _build_statement(tenant: TenantModel, db: Session) -> TenantStatement:
    leases = (
        db.query(LeaseModel)
        .options(
            joinedload(LeaseModel.unit),
            joinedload(LeaseModel.payment_schedules),
        )
        .filter(LeaseModel.tenant_id == tenant.id)
        .all()
    )

    total_due = 0.0
    total_paid = 0.0
    transactions = []
    unit_names = []

    for lease in leases:
        unit_names.append(lease.unit.name)
        for s in sorted(lease.payment_schedules, key=lambda x: x.due_date):
            total_due += float(s.amount)
            if s.status == "paid":
                total_paid += float(s.amount)
            transactions.append(StatementTransaction(
                date=s.due_date,
                description=f"Rent — {lease.unit.name}",
                amount=float(s.amount),
                status=s.status.value,
            ))

    return TenantStatement(
        tenant_name=tenant.full_name,
        unit_name=", ".join(sorted(set(unit_names))) or "N/A",
        total_due=total_due,
        total_paid=total_paid,
        balance=total_due - total_paid,
        transactions=transactions,
    )


@router.get("/{tenant_id}", response_model=TenantStatement)
def get_tenant_statement(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    tenant = db.query(TenantModel).filter(
        TenantModel.id == tenant_id, TenantModel.user_id == current_user.id
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return _build_statement(tenant, db)


@router.get("/{tenant_id}/download")
def download_tenant_statement(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    tenant = db.query(TenantModel).filter(
        TenantModel.id == tenant_id, TenantModel.user_id == current_user.id
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    statement = _build_statement(tenant, db)
    pdf_buffer = generate_statement_pdf(
        tenant_name=statement.tenant_name,
        unit_name=statement.unit_name,
        total_due=statement.total_due,
        total_paid=statement.total_paid,
        balance=statement.balance,
        transactions=[t.model_dump() for t in statement.transactions],
    )

    safe_name = statement.tenant_name.replace(" ", "_").replace("/", "-")
    logger.info("PDF statement downloaded: tenant %s (user %s)", tenant_id, current_user.id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Statement_{safe_name}.pdf"'},
    )
