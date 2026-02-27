# Rent & Lease Automation System

## 🚀 Quick Start (Recommended)

The easiest way to start the system is using **Docker Compose**. This will set up the database, backend, and frontend automatically.

1. Ensure you have Docker installed.
2. Run:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://localhost:8000` and the frontend at `http://localhost:8000` (served by the backend).

---

## 🛠️ Manual Development Setup

If you want to run the frontend and backend separately for development (with hot-reloading):

### 1. Backend (FastAPI)

1. **Create and activate a virtual environment:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run migrations:**
   ```bash
   alembic upgrade head
   ```
4. **Start the backend:**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### 2. Frontend (React + Vite)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. The frontend will be available at `http://localhost:5173`.

---

## ⚙️ Environment variables

Create a `.env` file from the example (do not commit `.env`):

```bash
cp .env.example .env
```

Then edit `.env` and set:

- **Database:** `POSTGRES_*` (used by Docker and the API).
- **Password reset (production):**
  - **`FRONTEND_URL`** – Your frontend base URL (e.g. `https://app.yourdomain.com`) so the reset link in emails points to the correct site.
  - **SMTP:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (and optionally `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`) so reset links are sent by email. If SMTP is not set, reset links are only printed in the server log (suitable for development only).

---

## 🔍 Troubleshooting

### `uvicorn` is not recognized
If you get the error: `uvicorn : The term 'uvicorn' is not recognized...`, it usually means `uvicorn` is not in your system PATH.

**Solutions:**
1. **Use `python -m`**: Instead of `uvicorn ...`, run:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
2. **Activate your virtual environment**: Ensure you have activated your `.venv` before running the command.
3. **Check Installation**: Ensure you have installed the dependencies using `pip install -r requirements.txt`.
