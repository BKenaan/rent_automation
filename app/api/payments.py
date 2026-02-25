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


@router.get("/", response_model=List[PaymentScheduleWithDetails])
def list_payments(
    status: Optional[PaymentStatus] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List payment schedules, optionally filtered by status.
    Used by the dashboard and payments page.
    """
    query = db.query(PaymentSchedule).options(
        joinedload(PaymentSchedule.lease).joinedload(Lease.tenant),
        joinedload(PaymentSchedule.lease).joinedload(Lease.unit)
    )
    if status is not None:
        query = query.filter(PaymentSchedule.status == status)
    return query.order_by(PaymentSchedule.due_date.desc()).all()


@router.post("/{schedule_id}/record", response_model=PaymentScheduleSchema)
def record_payment(schedule_id: int, payment: PaymentRecord, db: Session = Depends(get_db)):
    db_schedule = db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()
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
def read_payment_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    return db_schedule
