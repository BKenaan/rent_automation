from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.payment_schedule import PaymentSchedule
from app.models.tenant import Tenant
from app.models.notification_log import NotificationLog
from app.models.enums import PaymentStatus

def check_status():
    db = SessionLocal()
    try:
        today = date.today()
        upcoming_7 = today + timedelta(days=7)
        
        print(f"--- Diagnostic Status Checks ({today}) ---")
        
        # Check Tenants
        tenants = db.query(Tenant).all()
        print(f"Total Tenants: {len(tenants)}")
        for t in tenants:
            print(f"  - {t.full_name}: ID={t.id}, Phone={t.phone}")
            
        # Check Payments
        print("\n--- Eligible Payments for Reminders ---")
        all_pending = db.query(PaymentSchedule).filter(PaymentSchedule.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE])).all()
        print(f"Total Pending/Overdue Schedules: {len(all_pending)}")
        
        due_7 = [s for s in all_pending if s.due_date == upcoming_7]
        due_today = [s for s in all_pending if s.due_date == today]
        overdue = [s for s in all_pending if s.due_date < today]
        
        print(f"Due in 7 days: {len(due_7)}")
        print(f"Due today: {len(due_today)}")
        print(f"Overdue: {len(overdue)}")
        
        for s in due_7 + due_today + overdue:
            print(f"  - ID {s.id}: Due {s.due_date}, Amount {s.amount}, Tenant ID {s.lease.tenant_id if s.lease else 'N/A'}")

        # Check Logs
        print("\n--- Recent Notification Logs ---")
        logs = db.query(NotificationLog).all()
        print(f"Total Logs: {len(logs)}")
        for l in logs:
            print(f"  - Log ID {l.id}: Sent to Tenant {l.tenant_id} on {l.triggered_on} (Type: {l.type})")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_status()
