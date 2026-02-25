import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.enums import NotificationChannel, NotificationType
from app.core.config import settings
import aiosmtplib
from email.message import EmailMessage

class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        pass

class WhatsAppProvider(NotificationProvider):
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        # Placeholder for WhatsApp API (e.g., Twilio or Meta WhatsApp Cloud API)
        print(f"DEBUG: Sending WhatsApp message to {to}: {message}")
        return True

class ZapierProvider(NotificationProvider):
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        if not settings.ZAPIER_WEBHOOK_URL:
            print("WARN: Zapier Webhook URL not configured.")
            return False
            
        async with httpx.AsyncClient() as client:
            try:
                # Zapier usually expects a JSON payload
                data = {
                    "to": to,
                    "message": message,
                    "payload": payload or {}
                }
                response = await client.post(settings.ZAPIER_WEBHOOK_URL, json=data)
                
                if response.status_code >= 200 and response.status_code < 300:
                    print(f"DEBUG: Successfully sent notification to Zapier for {to}")
                    return True
                else:
                    print(f"ERROR: Zapier returned status {response.status_code}: {response.text}")
                    return False
            except Exception as e:
                print(f"ERROR: Failed to send to Zapier: {e}")
                return False

class EmailProvider(NotificationProvider):
    async def send(self, to: str, message: str, payload: Dict[str, Any] = None) -> bool:
        if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
            print("WARN: SMTP settings not fully configured.")
            return False

        msg = EmailMessage()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = to
        msg["Subject"] = payload.get("subject", "Rent Notification") if payload else "Rent Notification"
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
            print(f"DEBUG: Successfully sent email to {to}")
            return True
        except Exception as e:
            print(f"ERROR: Failed to send email to {to}: {e}")
            return False

class NotificationService:
    def __init__(self):
        # Default to WhatsAppProvider (Mock)
        self.providers = {
            NotificationChannel.WHATSAPP: WhatsAppProvider()
        }
        
        # If Zapier is configured, use it instead for WhatsApp channel
        if settings.ZAPIER_WEBHOOK_URL:
            self.providers[NotificationChannel.WHATSAPP] = ZapierProvider()
            
        # Register EmailProvider
        self.providers[NotificationChannel.EMAIL] = EmailProvider()

    async def notify(
        self, 
        channel: NotificationChannel, 
        to: str, 
        message: str, 
        payload: Dict[str, Any] = None
    ) -> bool:
        provider = self.providers.get(channel)
        if not provider:
            print(f"WARN: No provider found for channel {channel}")
            return False
        return await provider.send(to, message, payload)

notification_service = NotificationService()
