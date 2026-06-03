import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timezone
from app.db.session import get_db
from app.models.payment_schedule import PaymentSchedule
from app.models.lease import Lease
from app.models.enums import PaymentStatus
from app.schemas.payment_record import PaymentRecord
from app.schemas.lease import PaymentSchedule as PaymentScheduleSchema, PaymentScheduleWithDetails
from app.api.deps import get_current_user
from app.models.user import User as UserModel
from app.models.tenant import Tenant as TenantModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


def _payment_schedule_belongs_to_user(db: Session, schedule_id: int, user_id: int):
    return (
        db.query(PaymentSchedule)
        .join(Lease)
        .join(TenantModel)
        .filter(PaymentSchedule.id == schedule_id, TenantModel.user_id == user_id)
        .first()
    )


@router.get("/", response_model=List[PaymentScheduleWithDetails])
def list_payments(
    status: Optional[PaymentStatus] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    List payment schedules for the current user's leases.
    Optionally filter by status: pending | paid | overdue.
    Use skip/limit for pagination (default 50, max 200).
    """
    query = (
        db.query(PaymentSchedule)
        .options(
            joinedload(PaymentSchedule.lease).joinedload(Lease.tenant),
            joinedload(PaymentSchedule.lease).joinedload(Lease.unit),
        )
        .join(Lease)
        .join(TenantModel)
        .filter(TenantModel.user_id == current_user.id)
    )
    if status is not None:
        query = query.filter(PaymentSchedule.status == status)

    return (
        query.order_by(PaymentSchedule.due_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/{schedule_id}/record", response_model=PaymentScheduleSchema)
def record_payment(
    schedule_id: int,
    payment: PaymentRecord,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Record a received payment for a schedule owned by the current user."""
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
    logger.info(
        "Payment recorded: schedule %s, method %s (user %s)",
        schedule_id, payment.payment_method, current_user.id,
    )
    return db_schedule


@router.post("/{schedule_id}/revert", response_model=PaymentScheduleSchema)
def revert_payment(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Undo a recorded payment — clears the payment details and restores the
    schedule to pending (or overdue if its due date has passed)."""
    db_schedule = _payment_schedule_belongs_to_user(db, schedule_id, current_user.id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if db_schedule.status != PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="This payment is not marked as paid.")

    db_schedule.status = PaymentStatus.OVERDUE if db_schedule.due_date < date.today() else PaymentStatus.PENDING
    db_schedule.paid_at = None
    db_schedule.payment_method = None
    db_schedule.reference = None
    db_schedule.notes = None
    db.commit()
    db.refresh(db_schedule)
    logger.info("Payment reverted: schedule %s (user %s)", schedule_id, current_user.id)
    return db_schedule


@router.get("/{schedule_id}", response_model=PaymentScheduleSchema)
def read_payment_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_schedule = _payment_schedule_belongs_to_user(db, schedule_id, current_user.id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    return db_schedule
