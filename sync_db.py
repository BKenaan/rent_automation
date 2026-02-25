import sys
import os
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.db.session import Base
from app.models import * # Load all models

def sync():
    # Detect if we should use local sqlite
    url = settings.DATABASE_URL
    if "db:5432" in url:
        print(f"Postgres host 'db' detected. Checking if reachable...")
        import socket
        try:
            socket.gethostbyname('db')
        except:
            print("Host 'db' unreachable. Falling back to local sqlite 'test.db'")
            url = "sqlite:///./test.db"

    print(f"Connecting to database: {url}")
    engine = create_engine(url)
    
    # Simple table creation
    Base.metadata.create_all(bind=engine)
    
    # Manual check for new columns in 'units' table
    columns_to_add = [
        ("purchase_price", "NUMERIC(12, 2)"),
        ("target_yield", "NUMERIC(5, 2)")
    ]
    
    with engine.connect() as conn:
        # Check existing columns
        if "postgresql" in url:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='units'"))
            existing_cols = [row[0] for row in result]
        else:
            result = conn.execute(text("PRAGMA table_info(units)"))
            existing_cols = [row[1] for row in result]
        
        for col_name, col_type in columns_to_add:
            if col_name not in existing_cols:
                print(f"Adding column {col_name} to units table...")
                try:
                    conn.execute(text(f"ALTER TABLE units ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")
            else:
                print(f"Column {col_name} already exists.")
                
    print("Database sync complete.")

if __name__ == "__main__":
    # Add project root to path
    sys.path.insert(0, os.getcwd())
    sync()
