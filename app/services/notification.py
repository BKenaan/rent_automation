import logging
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.enums import NotificationChannel
from app.core.config import settings
import aiosmtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        pass


class EmailProvider(NotificationProvider):
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
            logger.warning("SMTP not fully configured — skipping email to %s", to)
            return False

        msg = EmailMessage()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = to
        msg["Subject"] = (payload or {}).get("subject", "RentalMan Notification")
        msg.set_content(message)

        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_PORT == 465,
                start_tls=settings.SMTP_PORT == 587,
            )
            logger.info("Email sent to %s (subject: %s)", to, msg["Subject"])
            return True
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to, e)
            return False


class NotificationService:
    def __init__(self):
        self.providers: Dict[NotificationChannel, NotificationProvider] = {
            NotificationChannel.EMAIL: EmailProvider(),
        }

    async def notify(
        self,
        channel: NotificationChannel,
        to: str,
        message: str,
        payload: Dict[str, Any] = None,
    ) -> bool:
        provider = self.providers.get(channel)
        if not provider:
            logger.warning("No provider registered for channel %s — skipping", channel)
            return False
        return await provider.send(to, message, payload)


notification_service = NotificationService()
