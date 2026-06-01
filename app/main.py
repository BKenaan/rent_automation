from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api import tenants, units, leases, payments, expenses, statements, auth, scheduler as scheduler_api
from app.core.scheduler import setup_scheduler, shutdown_scheduler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_scheduler()
    yield
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Scope CORS to exact allowed origins only
_cors_origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(units.router)
app.include_router(leases.router)
app.include_router(payments.router)
app.include_router(expenses.router)
app.include_router(statements.router)
app.include_router(scheduler_api.router)

# Serve static files from the frontend build directory
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


@app.get("/")
def root():
    return {"message": "Rent & Lease Automation System API"}
