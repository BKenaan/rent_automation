from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.payment_schedule import PaymentSchedule
from app.models.lease import Lease
from app.models.enums import PaymentStatus
from app.schemas.payment_record import PaymentRecord
from app.schemas.lease import PaymentSchedule as PaymentScheduleSchema, PaymentScheduleWithDetails

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/payments", tags=["payments"])


from app.models.tenant import Tenant as TenantModel


def _payment_schedule_belongs_to_user(db: Session, schedule_id: int, user_id: int):
    return db.query(PaymentSchedule).join(Lease).join(TenantModel).filter(
        PaymentSchedule.id == schedule_id, TenantModel.user_id == user_id
    ).first()


@router.get("/", response_model=List[PaymentScheduleWithDetails])
def list_payments(
    status: Optional[PaymentStatus] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List payment schedules for the current user's leases only.
    """
    query = db.query(PaymentSchedule).options(
        joinedload(PaymentSchedule.lease).joinedload(Lease.tenant),
        joinedload(PaymentSchedule.lease).joinedload(Lease.unit)
    ).join(Lease).join(TenantModel).filter(TenantModel.user_id == current_user.id)
    if status is not None:
        query = query.filter(PaymentSchedule.status == status)
    return query.order_by(PaymentSchedule.due_date.desc()).all()


@router.post("/{schedule_id}/record", response_model=PaymentScheduleSchema)
def record_payment(schedule_id: int, payment: PaymentRecord, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    db_schedule = _payment_schedule_belongs_to_user(db, schedule_id, current_user.id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    db_schedule.status = PaymentStatus.PAID
    db_schedule.paid_at = payment.paid_at or datetime.now(timezone.utc)
    db_schedule.payment_method = payment.payment_method
    db_schedule.reference = payment.reference
    db_schedule.notes = payment.notes
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.get("/{schedule_id}", response_model=PaymentScheduleSchema)
def read_payment_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    db_schedule = _payment_schedule_belongs_to_user(db, schedule_id, current_user.id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    return db_schedule
