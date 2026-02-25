from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.lease import Lease as LeaseModel
from app.schemas.lease import Lease, LeaseCreate, LeaseUpdate
from app.services.payment_schedule import schedule_service
from app.models.payment_schedule import PaymentSchedule

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/leases", tags=["leases"])

@router.post("/", response_model=Lease, status_code=status.HTTP_201_CREATED)
def create_lease(
    lease: LeaseCreate, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    db_lease = LeaseModel(**lease.model_dump())
    db.add(db_lease)
    db.commit()
    db.refresh(db_lease)
    
    # Generate payment schedules
    schedules = schedule_service.generate_schedules(db_lease)
    db.add_all(schedules)
    db.commit()
    db.refresh(db_lease)
    
    return db_lease

@router.get("/", response_model=List[Lease])
def read_leases(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    leases = db.query(LeaseModel).offset(skip).limit(limit).all()
    return leases

@router.get("/{lease_id}", response_model=Lease)
def read_lease(lease_id: int, db: Session = Depends(get_db)):
    db_lease = db.query(LeaseModel).filter(LeaseModel.id == lease_id).first()
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    return db_lease

@router.put("/{lease_id}", response_model=Lease)
def update_lease(lease_id: int, lease: LeaseUpdate, db: Session = Depends(get_db)):
    db_lease = db.query(LeaseModel).filter(LeaseModel.id == lease_id).first()
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    update_data = lease.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lease, key, value)
    
    db.commit()
    
    # Regenerate schedules if rent_amount, dates or frequency changed
    if any(k in update_data for k in ["rent_amount", "start_date", "end_date", "payment_frequency_months"]):
        schedule_service.regenerate_schedules(db, db_lease)
    
    db.refresh(db_lease)
    return db_lease

@router.delete("/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lease(lease_id: int, db: Session = Depends(get_db)):
    db_lease = db.query(LeaseModel).filter(LeaseModel.id == lease_id).first()
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    db.delete(db_lease)
    db.commit()
    return None

@router.post("/{lease_id}/regenerate-schedules", response_model=Lease)
def manual_regenerate_schedules(lease_id: int, db: Session = Depends(get_db)):
    db_lease = db.query(LeaseModel).filter(LeaseModel.id == lease_id).first()
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    schedule_service.regenerate_schedules(db, db_lease)
    db.refresh(db_lease)
    return db_lease
