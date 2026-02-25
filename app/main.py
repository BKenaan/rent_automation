from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api import tenants, units, leases, payments, expenses, statements, auth, scheduler as scheduler_api
from app.core.scheduler import setup_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Setup scheduler
    setup_scheduler()
    yield
    # Shutdown: Stop scheduler
    shutdown_scheduler()

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; refine for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
