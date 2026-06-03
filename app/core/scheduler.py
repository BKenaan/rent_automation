from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.reminder import reminder_service
from app.services.landlord_digest import process_landlord_digests
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def scheduled_reminder_job():
    logger.info("Starting scheduled reminder job...")
    await reminder_service.process_reminders()
    logger.info("Finished scheduled reminder job.")

async def scheduled_landlord_digest_job():
    logger.info("Starting landlord digest job...")
    await process_landlord_digests()
    logger.info("Finished landlord digest job.")

def setup_scheduler():
    # Tenant rent reminders — every day at 09:00
    scheduler.add_job(
        scheduled_reminder_job,
        CronTrigger(hour=9, minute=0),
        id="rent_reminders",
        replace_existing=True
    )
    # Landlord daily digest (email + push) — every day at 08:00
    scheduler.add_job(
        scheduled_landlord_digest_job,
        CronTrigger(hour=8, minute=0),
        id="landlord_digest",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shutdown.")
