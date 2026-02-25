from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.reminder import reminder_service
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def scheduled_reminder_job():
    logger.info("Starting scheduled reminder job...")
    await reminder_service.process_reminders()
    logger.info("Finished scheduled reminder job.")

def setup_scheduler():
    # Run every day at 09:00 AM
    scheduler.add_job(
        scheduled_reminder_job,
        CronTrigger(hour=9, minute=0),
        id="rent_reminders",
        replace_existing=True
    )
    # Also run once on startup for debugging/initial check
    # scheduler.add_job(scheduled_reminder_job) 
    
    scheduler.start()
    logger.info("Scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shutdown.")
