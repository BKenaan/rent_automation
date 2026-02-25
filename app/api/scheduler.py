from fastapi import APIRouter, Depends
from app.core.scheduler import scheduled_reminder_job

from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/scheduler", tags=["scheduler"])

@router.post("/trigger-reminders")
async def trigger_reminders(current_user: UserModel = Depends(get_current_user)):
    """
    Manually trigger the reminder job.
    """
    await scheduled_reminder_job()
    return {"message": "Reminder job triggered successfully"}
