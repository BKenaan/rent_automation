from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from app.models.payment_schedule import PaymentSchedule
from app.models.enums import PaymentStatus, NotificationType, NotificationChannel
from app.models.notification_log import NotificationLog
from app.services.notification import notification_service
from app.db.session import SessionLocal

class ReminderService:
    @staticmethod
    async def process_reminders():
        """
        Check for payments due today or overdue and send notifications.
        """
        db = SessionLocal()
        try:
            today = date.today()
            from datetime import timedelta
            upcoming_7_days = today + timedelta(days=7)

            # 1. Check for payments due in 7 days
            upcoming = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date == upcoming_7_days,
                PaymentSchedule.status == PaymentStatus.PENDING
            ).all()

            for schedule in upcoming:
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_UPCOMING)

            # 2. Check for payments due today
            due_today = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date == today,
                PaymentSchedule.status == PaymentStatus.PENDING
            ).all()

            for schedule in due_today:
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_DUE)

            # 3. Check for overdue payments
            overdue = db.query(PaymentSchedule).filter(
                PaymentSchedule.due_date < today,
                PaymentSchedule.status == PaymentStatus.PENDING
            ).all()

            for schedule in overdue:
                # Mark as overdue if not already
                if schedule.status != PaymentStatus.OVERDUE:
                    schedule.status = PaymentStatus.OVERDUE
                    db.add(schedule)
                
                await ReminderService.send_reminder(db, schedule, NotificationType.RENT_OVERDUE)

            db.commit()
        finally:
            db.close()

    @staticmethod
    async def send_reminder(db: Session, schedule: PaymentSchedule, msg_type: NotificationType):
        tenant = schedule.lease.tenant
        
        # Check if we already sent this type of notification today to avoid spam
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        existing_log = db.query(NotificationLog).filter(
            NotificationLog.payment_schedule_id == schedule.id,
            NotificationLog.type == msg_type,
            NotificationLog.triggered_on >= today_start
        ).first()

        if existing_log:
            return

        message = ""
        if msg_type == NotificationType.RENT_UPCOMING:
            message = f"Reminder: Hello {tenant.full_name}, your rent for unit {schedule.lease.unit.name} is due in 7 days ({schedule.due_date}). Amount: {schedule.amount} {schedule.lease.currency}."
        elif msg_type == NotificationType.RENT_DUE:
            message = f"Hello {tenant.full_name}, your rent for unit {schedule.lease.unit.name} is due today. Amount: {schedule.amount} {schedule.lease.currency}."
        elif msg_type == NotificationType.RENT_OVERDUE:
            message = f"Hello {tenant.full_name}, your rent for unit {schedule.lease.unit.name} is OVERDUE. Amount: {schedule.amount} {schedule.lease.currency}. Please pay ASAP."

        # Send WhatsApp
        await notification_service.notify(
            channel=NotificationChannel.WHATSAPP,
            to=tenant.phone,
            message=message,
            payload={"schedule_id": schedule.id}
        )
        
        # Send Email (Free of charge)
        sent_email = await notification_service.notify(
            channel=NotificationChannel.EMAIL,
            to=tenant.email,
            message=message,
            payload={
                "schedule_id": schedule.id,
                "subject": f"Rent Reminder: {msg_type.replace('_', ' ').title()}"
            }
        )

        if sent_email:
            log = NotificationLog(
                tenant_id=tenant.id,
                lease_id=schedule.lease.id,
                payment_schedule_id=schedule.id,
                type=msg_type,
                channel=NotificationChannel.EMAIL,
                triggered_on=datetime.now(timezone.utc),
                payload_json={"message": message}
            )
            db.add(log)

reminder_service = ReminderService()
