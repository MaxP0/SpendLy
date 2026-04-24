# Spendly

Spendly is a FastAPI + React financial/tax management app for Irish self-employed users and PAYE employees with side income.

## Stack
- Backend: FastAPI + SQLAlchemy 2.x async
- Database: PostgreSQL 16
- Migrations: Alembic
- Frontend: React + Vite
- Local orchestration: Docker Compose

## Quick Start
1. Start services:

```bash
docker compose up --build
```

2. Verify backend health:

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

3. Open the app and API docs:
- Frontend: http://localhost:5173
- Swagger UI: http://localhost:8000/docs

## Services
- `db`: PostgreSQL 16
- `backend`: FastAPI API server (runs Alembic upgrade on startup)
- `frontend`: Vite dev server

## Environment
Backend environment template is in `backend/.env.example`.

Required variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`
- `OPENAI_API_KEY`
- `TESSERACT_CMD`
- `ENVIRONMENT`

## Development Notes
- The canonical local database is PostgreSQL only.
- Database schema changes should be handled through Alembic migrations in `database/migrations/`.
