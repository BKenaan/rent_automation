import logging
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.lease import Lease
from app.models.payment_schedule import PaymentSchedule
from app.models.enums import PaymentStatus, NotificationChannel
from app.services.notification import notification_service
from app.services.push import send_push

logger = logging.getLogger(__name__)


async def process_landlord_digests():
    """
    Once a day, send each landlord a summary of items that need attention
    (overdue payments, payments due within 7 days, leases expiring within 30
    days) via their chosen channels (email and/or push). Users with nothing
    to report — or both channels off — are skipped.
    """
    with SessionLocal() as db:
        today = date.today()
        soon = today + timedelta(days=7)
        expiry_cutoff = today + timedelta(days=30)

        users = db.query(User).filter(User.is_active.is_(True)).all()
        sent = 0

        for user in users:
            if not (user.notify_email or user.notify_push):
                continue

            base = (
                db.query(PaymentSchedule)
                .join(Lease, PaymentSchedule.lease_id == Lease.id)
                .join(Tenant, Lease.tenant_id == Tenant.id)
                .filter(Tenant.user_id == user.id)
            )
            overdue = base.filter(
                PaymentSchedule.status != PaymentStatus.PAID,
                PaymentSchedule.due_date < today,
            ).count()
            due_soon = base.filter(
                PaymentSchedule.status == PaymentStatus.PENDING,
                PaymentSchedule.due_date >= today,
                PaymentSchedule.due_date <= soon,
            ).count()
            expiring = (
                db.query(Lease)
                .join(Tenant, Lease.tenant_id == Tenant.id)
                .filter(
                    Tenant.user_id == user.id,
                    Lease.end_date >= today,
                    Lease.end_date <= expiry_cutoff,
                )
                .count()
            )

            if overdue == 0 and due_soon == 0 and expiring == 0:
                continue

            parts = []
            if overdue:
                parts.append(f"{overdue} overdue payment{'s' if overdue != 1 else ''}")
            if due_soon:
                parts.append(f"{due_soon} payment{'s' if due_soon != 1 else ''} due within 7 days")
            if expiring:
                parts.append(f"{expiring} lease{'s' if expiring != 1 else ''} expiring within 30 days")
            summary = "You have " + ", ".join(parts) + "."

            if user.notify_push and user.push_token:
                await send_push(user.push_token, "RentalMan", summary, {"type": "digest"})

            if user.notify_email:
                await notification_service.notify(
                    NotificationChannel.EMAIL,
                    to=user.email,
                    message=(
                        f"Hi {user.full_name or user.username},\n\n"
                        f"{summary}\n\n"
                        "Open RentalMan to review and take action.\n\n"
                        "— RentalMan\n\n"
                        "To change how you're notified, open Settings in the app."
                    ),
                    payload={"subject": "Your RentalMan summary"},
                )

            sent += 1

        logger.info("Landlord digests processed: %d users notified", sent)
