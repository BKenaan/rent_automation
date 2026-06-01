import logging
from fastapi import APIRouter, Depends
from app.core.scheduler import scheduled_reminder_job
from app.api.deps import get_current_active_superuser
from app.models.user import User as UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.post("/trigger-reminders")
async def trigger_reminders(current_user: UserModel = Depends(get_current_active_superuser)):
    """
    Manually trigger the reminder job. Superuser only.
    """
    logger.info("Manual reminder trigger by user %s", current_user.username)
    await scheduled_reminder_job()
    return {"message": "Reminder job triggered successfully"}
