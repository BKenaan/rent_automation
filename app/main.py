import logging
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

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_scheduler()
    logger.info("RentalMan API started.")
    yield
    shutdown_scheduler()
    logger.info("RentalMan API shut down.")

app = FastAPI(
    title="RentalMan API",
    description="Property management platform — REST API",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Scope to exact known origins. Mobile apps send no Origin header so they are
# not affected by CORS at all — CORSMiddleware only applies to browser requests.
_cors_origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Security headers ──────────────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Health check (no auth — for load balancers and uptime monitors) ───────────
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "RentalMan API", "version": "1.0.0"}

# ── Versioned API routes ──────────────────────────────────────────────────────
API_V1 = "/api/v1"

app.include_router(auth.router,          prefix=API_V1)
app.include_router(tenants.router,       prefix=API_V1)
app.include_router(units.router,         prefix=API_V1)
app.include_router(leases.router,        prefix=API_V1)
app.include_router(payments.router,      prefix=API_V1)
app.include_router(expenses.router,      prefix=API_V1)
app.include_router(statements.router,    prefix=API_V1)
app.include_router(scheduler_api.router, prefix=API_V1)

# ── Serve React frontend (must be LAST — catches all unmatched paths) ─────────
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    logger.info("Serving frontend from %s", frontend_path)
else:
    logger.warning("Frontend dist not found at %s — API-only mode", frontend_path)
