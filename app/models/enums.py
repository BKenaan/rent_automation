import enum

class UnitType(str, enum.Enum):
    SHOP = "shop"
    APARTMENT = "apartment"

class LeaseStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"
    TERMINATED = "terminated"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"

class NotificationType(str, enum.Enum):
    RENT_UPCOMING = "rent_upcoming"
    RENT_DUE = "rent_due"
    RENT_OVERDUE = "rent_overdue"
    LEASE_EXPIRING = "lease_expiring"
    GENERAL = "general"

class NotificationChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
