from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.expense import Expense as ExpenseModel
from app.schemas.expense import Expense, ExpenseCreate, ExpenseUpdate

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/", response_model=Expense, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    db_expense = ExpenseModel(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[Expense])
def read_expenses(
    skip: int = 0, 
    limit: int = 100, 
    unit_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    query = db.query(ExpenseModel)
    if unit_id:
        query = query.filter(ExpenseModel.unit_id == unit_id)
    return query.offset(skip).limit(limit).all()

@router.get("/{expense_id}", response_model=Expense)
def read_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.put("/{expense_id}", response_model=Expense)
def update_expense(expense_id: int, expense: ExpenseUpdate, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return None
