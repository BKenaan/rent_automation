import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.lease import Lease as LeaseModel
from app.schemas.lease import Lease, LeaseCreate, LeaseUpdate
from app.services.payment_schedule import schedule_service
from app.models.payment_schedule import PaymentSchedule
from app.api.deps import get_current_user
from app.models.user import User as UserModel
from app.models.tenant import Tenant as TenantModel
from app.models.unit import Unit as UnitModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leases", tags=["leases"])


def _lease_belongs_to_user(db: Session, lease_id: int, user_id: int) -> LeaseModel | None:
    return db.query(LeaseModel).join(TenantModel).filter(
        LeaseModel.id == lease_id, TenantModel.user_id == user_id
    ).first()


def _serialize_rent_changes(rc_list):
    """Convert rent_changes (list of dicts with date objects) to JSON-safe form."""
    if not rc_list:
        return rc_list
    out = []
    for rc in rc_list:
        ed = rc.get("effective_date")
        out.append({
            "effective_date": ed.isoformat() if hasattr(ed, "isoformat") else str(ed),
            "amount": float(rc.get("amount")),
        })
    # keep them sorted by date for predictable application
    return sorted(out, key=lambda r: r["effective_date"])


@router.post("/", response_model=Lease, status_code=status.HTTP_201_CREATED)
def create_lease(
    lease: LeaseCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    tenant = db.query(TenantModel).filter(
        TenantModel.id == lease.tenant_id, TenantModel.user_id == current_user.id
    ).first()
    unit = db.query(UnitModel).filter(
        UnitModel.id == lease.unit_id, UnitModel.user_id == current_user.id
    ).first()
    if not tenant or not unit:
        raise HTTPException(status_code=404, detail="Tenant or unit not found or not owned by you")

    data = lease.model_dump()
    data["rent_changes"] = _serialize_rent_changes(data.get("rent_changes"))
    db_lease = LeaseModel(**data)
    db.add(db_lease)
    db.commit()
    db.refresh(db_lease)

    schedules = schedule_service.generate_schedules(db_lease)
    db.add_all(schedules)
    db.commit()
    db.refresh(db_lease)
    logger.info("Lease created: %s (user %s), %d schedules", db_lease.id, current_user.id, len(schedules))
    return db_lease


@router.get("/", response_model=List[Lease])
def read_leases(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """List leases. Use skip/limit for pagination (default 50, max 200)."""
    return (
        db.query(LeaseModel)
        .join(TenantModel)
        .filter(TenantModel.user_id == current_user.id)
        .order_by(LeaseModel.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{lease_id}", response_model=Lease)
def read_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_lease = _lease_belongs_to_user(db, lease_id, current_user.id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    return db_lease


@router.put("/{lease_id}", response_model=Lease)
def update_lease(
    lease_id: int,
    lease: LeaseUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_lease = _lease_belongs_to_user(db, lease_id, current_user.id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")

    update_data = lease.model_dump(exclude_unset=True)
    if "rent_changes" in update_data:
        update_data["rent_changes"] = _serialize_rent_changes(update_data["rent_changes"])
    for key, value in update_data.items():
        setattr(db_lease, key, value)
    db.commit()

    if any(k in update_data for k in ["rent_amount", "start_date", "end_date", "payment_frequency_months", "rent_changes"]):
        schedule_service.regenerate_schedules(db, db_lease)

    db.refresh(db_lease)
    return db_lease


@router.delete("/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_lease = _lease_belongs_to_user(db, lease_id, current_user.id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    db.delete(db_lease)
    db.commit()
    logger.info("Lease deleted: %s (user %s)", lease_id, current_user.id)
    return None


@router.post("/{lease_id}/regenerate-schedules", response_model=Lease)
def manual_regenerate_schedules(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_lease = _lease_belongs_to_user(db, lease_id, current_user.id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    schedule_service.regenerate_schedules(db, db_lease)
    db.refresh(db_lease)
    return db_lease
