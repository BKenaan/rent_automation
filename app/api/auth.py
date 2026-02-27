from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.enums import NotificationChannel
from app.schemas.user import User, UserCreate, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.token import Token
from app.core import security
from app.core.config import settings
from app.services.notification import notification_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=User)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Create new user.
    """
    user = db.query(UserModel).filter(
        (UserModel.email == user_in.email) | (UserModel.username == user_in.username)
    ).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="User with this email or username already exists.",
        )
    
    db_user = UserModel(
        email=user_in.email,
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=user_in.is_active if user_in.is_active is not None else True,
        is_superuser=user_in.is_superuser if user_in.is_superuser is not None else False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(UserModel).filter(UserModel.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset. If the email exists, a reset link is sent (when SMTP is configured).
    Always returns the same message to avoid revealing whether the email is registered.
    """
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if not user:
        return {"message": "If that email is registered, you will receive a password reset link."}

    reset_token = security.create_password_reset_token(user.email)
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{base_url}/reset-password?token={reset_token}"

    if all([getattr(settings, "SMTP_HOST", None), getattr(settings, "SMTP_USER", None)]):
        message = (
            f"Hi {user.full_name or user.username},\n\n"
            f"Use this link to reset your password (valid for 1 hour):\n{reset_link}\n\n"
            "If you didn't request this, you can ignore this email."
        )
        await notification_service.notify(
            NotificationChannel.EMAIL,
            to=user.email,
            message=message,
            payload={"subject": "Reset your password"},
        )
    else:
        # Dev: log link so you can test without email
        print(f"DEBUG Password reset link for {user.email}: {reset_link}")

    return {"message": "If that email is registered, you will receive a password reset link."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Set a new password using the token from the forgot-password email link.
    """
    email = security.decode_password_reset_token(body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link. Please request a new one.",
        )
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    user.hashed_password = security.get_password_hash(body.new_password)
    db.add(user)
    db.commit()
    return {"message": "Password has been reset. You can sign in with your new password."}
