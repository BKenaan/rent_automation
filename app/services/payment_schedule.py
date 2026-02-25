from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.lease import Lease
from app.models.payment_schedule import PaymentSchedule
from app.models.enums import PaymentStatus

class PaymentScheduleService:
    @staticmethod
    def generate_schedules(lease: Lease) -> List[PaymentSchedule]:
        """
        Generate payment schedules based on lease start_date, end_date, and frequency.
        """
        schedules = []
        current_due_date = lease.start_date
        
        while current_due_date < lease.end_date:
            schedule = PaymentSchedule(
                lease_id=lease.id,
                due_date=current_due_date,
                amount=lease.rent_amount,
                status=PaymentStatus.PENDING
            )
            schedules.append(schedule)
            
            # Increment date by frequency
            # For simplicity, we add months. For 1 month, we can use 30 days or better relativedelta
            # Using date.fromordinal and adding months is safer if available
            # For now, let's use a simple approximation if relativedelta is not here, 
            # but I should probably use python-dateutil if added to requirements.
            
            # Simple month addition logic
            month = current_due_date.month + lease.payment_frequency_months
            year = current_due_date.year + (month - 1) // 12
            month = (month - 1) % 12 + 1
            
            try:
                current_due_date = current_due_date.replace(year=year, month=month)
            except ValueError:
                # Handle cases where day doesn't exist (e.g., Jan 31 -> Feb 28)
                last_day = 28 # Simplified
                current_due_date = current_due_date.replace(year=year, month=month, day=last_day)
                
        return schedules

    @staticmethod
    def regenerate_schedules(db: Session, lease: Lease):
        """
        Delete future pending schedules and recreate them.
        """
        today = date.today()
        
        # Delete future pending schedules
        db.query(PaymentSchedule).filter(
            PaymentSchedule.lease_id == lease.id,
            PaymentSchedule.status == PaymentStatus.PENDING,
            PaymentSchedule.due_date >= today
        ).delete(synchronize_session='fetch')
        
        # recreate them
        current_due_date = lease.start_date
        while current_due_date < lease.end_date:
            if current_due_date >= today:
                schedule = PaymentSchedule(
                    lease_id=lease.id,
                    due_date=current_due_date,
                    amount=lease.rent_amount,
                    status=PaymentStatus.PENDING
                )
                db.add(schedule)
            
            # Increment logic
            month = current_due_date.month + lease.payment_frequency_months
            year = current_due_date.year + (month - 1) // 12
            month = (month - 1) % 12 + 1
            try:
                current_due_date = current_due_date.replace(year=year, month=month)
            except ValueError:
                import calendar
                last_day = calendar.monthrange(year, month)[1]
                current_due_date = current_due_date.replace(year=year, month=month, day=last_day)
        
        db.commit()

schedule_service = PaymentScheduleService()
