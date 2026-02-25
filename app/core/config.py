from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator
from typing import Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rent & Lease Automation"
    
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    
    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, info: Any) -> Any:
        if isinstance(v, str):
            # Check if this is a postgres URL with 'db' host and if it's reachable
            if "postgresql" in v and "@db" in v:
                import socket
                try:
                    # Attempt short timeout check
                    socket.create_connection(("db", 5432), timeout=1)
                except:
                    print("Postgres host 'db' unreachable. Falling back to local sqlite 'test.db'")
                    return "sqlite:///./test.db"
            return v
        
        # Build from components if not provided
        host = info.data.get("POSTGRES_HOST")
        if host == "db":
            import socket
            try:
                socket.create_connection(("db", 5432), timeout=1)
            except:
                print("Postgres host 'db' unreachable. Falling back to local sqlite 'test.db'")
                return "sqlite:///./test.db"

        return str(
            PostgresDsn.build(
                scheme="postgresql",
                username=info.data.get("POSTGRES_USER"),
                password=info.data.get("POSTGRES_PASSWORD"),
                host=host,
                port=int(info.data.get("POSTGRES_PORT")),
                path=f"{info.data.get('POSTGRES_DB') or ''}",
            )
        )

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # Security
    SECRET_KEY: str = "7290eb64817a7e8706a1478144883461" # Generatated for dev
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Notifications
    ZAPIER_WEBHOOK_URL: str | None = None
    
    # Email (Free SMTP)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str = "RentFlow Automation"

settings = Settings()
