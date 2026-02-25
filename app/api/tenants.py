from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.tenant import Tenant as TenantModel
from app.schemas.tenant import Tenant, TenantCreate, TenantUpdate

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.post("/", response_model=Tenant, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant: TenantCreate, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    db_tenant = TenantModel(**tenant.model_dump())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@router.get("/", response_model=List[Tenant])
def read_tenants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    tenants = db.query(TenantModel).offset(skip).limit(limit).all()
    return tenants

@router.get("/{tenant_id}", response_model=Tenant)
def read_tenant(tenant_id: int, db: Session = Depends(get_db)):
    db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant

@router.put("/{tenant_id}", response_model=Tenant)
def update_tenant(tenant_id: int, tenant: TenantUpdate, db: Session = Depends(get_db)):
    db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = tenant.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tenant, key, value)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: int, db: Session = Depends(get_db)):
    db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(db_tenant)
    db.commit()
    return None
