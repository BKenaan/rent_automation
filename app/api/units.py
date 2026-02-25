from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.unit import Unit as UnitModel
from app.schemas.unit import Unit, UnitCreate, UnitUpdate

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/units", tags=["units"])

@router.post("/", response_model=Unit, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit: UnitCreate, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    db_unit = UnitModel(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.get("/", response_model=List[Unit])
def read_units(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    units = db.query(UnitModel).offset(skip).limit(limit).all()
    return units

@router.get("/{unit_id}", response_model=Unit)
def read_unit(unit_id: int, db: Session = Depends(get_db)):
    db_unit = db.query(UnitModel).filter(UnitModel.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return db_unit

@router.put("/{unit_id}", response_model=Unit)
def update_unit(unit_id: int, unit: UnitUpdate, db: Session = Depends(get_db)):
    db_unit = db.query(UnitModel).filter(UnitModel.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    update_data = unit.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    db_unit = db.query(UnitModel).filter(UnitModel.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(db_unit)
    db.commit()
    return None
