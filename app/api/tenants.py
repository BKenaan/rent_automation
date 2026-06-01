import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.tenant import Tenant as TenantModel
from app.schemas.tenant import Tenant, TenantCreate, TenantUpdate
from app.api.deps import get_current_user
from app.models.user import User as UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/", response_model=Tenant, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant: TenantCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    data = tenant.model_dump()
    data["user_id"] = current_user.id
    db_tenant = TenantModel(**data)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    logger.info("Tenant created: %s (user %s)", db_tenant.id, current_user.id)
    return db_tenant


@router.get("/", response_model=List[Tenant])
def read_tenants(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """List tenants. Use skip/limit for pagination (default 50, max 200)."""
    return (
        db.query(TenantModel)
        .filter(TenantModel.user_id == current_user.id)
        .order_by(TenantModel.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{tenant_id}", response_model=Tenant)
def read_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_tenant = db.query(TenantModel).filter(
        TenantModel.id == tenant_id,
        TenantModel.user_id == current_user.id,
    ).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant


@router.put("/{tenant_id}", response_model=Tenant)
def update_tenant(
    tenant_id: int,
    tenant: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_tenant = db.query(TenantModel).filter(
        TenantModel.id == tenant_id,
        TenantModel.user_id == current_user.id,
    ).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for key, value in tenant.model_dump(exclude_unset=True).items():
        setattr(db_tenant, key, value)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    db_tenant = db.query(TenantModel).filter(
        TenantModel.id == tenant_id,
        TenantModel.user_id == current_user.id,
    ).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(db_tenant)
    db.commit()
    logger.info("Tenant deleted: %s (user %s)", tenant_id, current_user.id)
    return None
