import logging
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.payment_schedule import PaymentSchedule
from app.models.enums import PaymentStatus, NotificationType, NotificationChannel
from app.models.notification_log import NotificationLog
from app.services.notification import notification_service
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@contextmanager
def _get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ReminderService:
    @staticmethod
    async def process_reminders():
        """
        Check for upcoming, due, and overdue payments and send email reminders.
        Runs daily via APScheduler. Skips duplicates using NotificationLog.
        """
        with _get_db() as db:
            today = date.today()
            upcoming_7_days = today + timedelta(days=7)

            # 1. Payments due in 7 days
            upcoming = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date == upcoming_7_days,
                PaymentSchedule.status == PaymentStatus.PENDING,
            ).all()
            for schedule in upcoming:
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_UPCOMING)

            # 2. Payments due today
            due_today = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date == today,
                PaymentSchedule.status == PaymentStatus.PENDING,
            ).all()
            for schedule in due_today:
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_DUE)

            # 3. Overdue payments — mark status and send reminder
            overdue = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date < today,
                PaymentSchedule.status == PaymentStatus.PENDING,
            ).all()
            for schedule in overdue:
                schedule.status = PaymentStatus.OVERDUE
                db.add(schedule)
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_OVERDUE)

            db.commit()
            logger.info(
                "Reminders processed: %d upcoming, %d due today, %d overdue",
                len(upcoming), len(due_today), len(overdue),
            )

    @staticmethod
    async def send_reminder(db: Session, schedule: PaymentSchedule, msg_type: NotificationType):
        tenant = schedule.lease.tenant

        # Deduplicate — skip if we already sent this notification type today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        already_sent = db.query(NotificationLog).filter(
            NotificationLog.payment_schedule_id == schedule.id,
            NotificationLog.type == msg_type,
            NotificationLog.triggered_on >= today_start,
        ).first()
        if already_sent:
            return

        unit_name = schedule.lease.unit.name
        amount = schedule.amount
        currency = schedule.lease.currency

        if msg_type == NotificationType.RENT_UPCOMING:
            subject = "Rent due in 7 days — RentalMan"
            body = (
                f"Hello {tenant.full_name},\n\n"
                f"This is a friendly reminder that your rent for {unit_name} "
                f"is due on {schedule.due_date}.\n\n"
                f"Amount: {amount} {currency}\n\n"
                "Please ensure payment is made on time.\n\n"
                "— RentalMan"
            )
        elif msg_type == NotificationType.RENT_DUE:
            subject = "Rent is due today — RentalMan"
            body = (
                f"Hello {tenant.full_name},\n\n"
                f"Your rent for {unit_name} is due today ({schedule.due_date}).\n\n"
                f"Amount: {amount} {currency}\n\n"
                "Please make your payment as soon as possible.\n\n"
                "— RentalMan"
            )
        elif msg_type == NotificationType.RENT_OVERDUE:
            subject = "Rent is OVERDUE — RentalMan"
            body = (
                f"Hello {tenant.full_name},\n\n"
                f"Your rent for {unit_name} was due on {schedule.due_date} "
                f"and is now OVERDUE.\n\n"
                f"Amount: {amount} {currency}\n\n"
                "Please contact your landlord and arrange payment immediately.\n\n"
                "— RentalMan"
            )
        else:
            return

        sent = await notification_service.notify(
            channel=NotificationChannel.EMAIL,
            to=tenant.email,
            message=body,
            payload={"subject": subject, "schedule_id": schedule.id},
        )

        if sent:
            db.add(NotificationLog(
                tenant_id=tenant.id,
                lease_id=schedule.lease.id,
                payment_schedule_id=schedule.id,
                type=msg_type,
                channel=NotificationChannel.EMAIL,
                triggered_on=datetime.now(timezone.utc),
                payload_json={"subject": subject},
            ))
            logger.info("Reminder sent: %s → %s (%s)", msg_type, tenant.email, schedule.id)
        else:
            logger.warning("Reminder NOT sent: %s → %s (%s)", msg_type, tenant.email, schedule.id)


reminder_service = ReminderService()
