import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
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
from app.core.limiter import limiter
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(UserModel).filter(
        (UserModel.email == user_in.email) | (UserModel.username == user_in.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or username already exists.")

    db_user = UserModel(
        email=user_in.email,
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_superuser=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info("New user registered: %s", db_user.username)
    return db_user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Obtain a JWT access token. Accepts username or email in the username field."""
    login_input = form_data.username.strip()

    # Accept either username or email
    if "@" in login_input:
        user = db.query(UserModel).filter(UserModel.email == login_input).first()
    else:
        user = db.query(UserModel).filter(UserModel.username == login_input).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt for input: %s", login_input)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = security.create_access_token(
        user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    logger.info("User logged in: %s", user.username)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
def get_me(current_user: UserModel = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset link. Always returns the same message regardless of
    whether the email is registered, to prevent account enumeration.
    """
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if not user:
        return {"message": "If that email is registered, you will receive a password reset link."}

    reset_token = security.create_password_reset_token(user.email)
    base_url = settings.FRONTEND_URL.rstrip("/")
    reset_link = f"{base_url}/reset-password?token={reset_token}"

    if all([settings.SMTP_HOST, settings.SMTP_USER]):
        message = (
            f"Hi {user.full_name or user.username},\n\n"
            f"Use this link to reset your RentalMan password (valid for 1 hour):\n{reset_link}\n\n"
            "If you didn't request this, you can safely ignore this email."
        )
        await notification_service.notify(
            NotificationChannel.EMAIL,
            to=user.email,
            message=message,
            payload={"subject": "Reset your RentalMan password"},
        )
    else:
        # Dev only — never appears in production logs (LOG_LEVEL=INFO suppresses DEBUG)
        logger.debug("Password reset link for %s: %s", user.email, reset_link)

    return {"message": "If that email is registered, you will receive a password reset link."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Set a new password using the token from the reset email."""
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
    logger.info("Password reset for user: %s", user.username)
    return {"message": "Password has been reset. You can now sign in with your new password."}
