import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.unit import Unit as UnitModel
from app.schemas.unit import Unit, UnitCreate, UnitUpdate
from app.api.deps import get_current_user
from app.models.user import User as UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/units", tags=["units"])


@router.post("/", response_model=Unit, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit: UnitCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    data = unit.model_dump()
    data["user_id"] = current_user.id
    db_unit = UnitModel(**data)
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    logger.info("Unit created: %s (user %s)", db_unit.id, current_user.id)
    return db_unit


@router.get("/", response_model=List[Unit])
def read_units(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """List units. Use skip/limit for pagination (default 50, max 200)."""
    return (
        db.query(UnitModel)
        .filter(UnitModel.user_id == current_user.id)
        .order_by(UnitModel.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{unit_id}", response_model=Unit)
def read_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_unit = db.query(UnitModel).filter(
        UnitModel.id == unit_id,
        UnitModel.user_id == current_user.id,
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return db_unit


@router.put("/{unit_id}", response_model=Unit)
def update_unit(
    unit_id: int,
    unit: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_unit = db.query(UnitModel).filter(
        UnitModel.id == unit_id,
        UnitModel.user_id == current_user.id,
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    for key, value in unit.model_dump(exclude_unset=True).items():
        setattr(db_unit, key, value)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_unit = db.query(UnitModel).filter(
        UnitModel.id == unit_id,
        UnitModel.user_id == current_user.id,
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(db_unit)
    db.commit()
    logger.info("Unit deleted: %s (user %s)", unit_id, current_user.id)
    return None
