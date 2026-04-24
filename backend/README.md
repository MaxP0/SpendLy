# Spendly Backend API

A Python FastAPI backend for the Spendly financial management platform.

## Project Structure

```
backend/
├── app/
│   ├── api/v1/              # API routers
│   │   ├── auth.py
│   │   ├── inquiries.py
│   │   ├── receipts.py
│   │   ├── expenses.py
│   │   ├── invoices.py
│   │   ├── payments.py
│   │   ├── transactions.py
│   │   ├── tax.py
│   │   ├── insights.py
│   │   └── deps.py          # Dependencies (JWT validation)
│   │
│   ├── services/            # Business logic
│   │   ├── user_service.py
│   │   ├── inquiry_service.py
│   │   ├── receipt_service.py
│   │   ├── expense_service.py
│   │   ├── invoice_service.py
│   │   ├── payment_service.py
│   │   ├── transaction_service.py
│   │   ├── tax_engine.py    # Strategy pattern for tax calculations
│   │   ├── anonymiser.py    # Proxy pattern for data anonymization
│   │   ├── ocr_service.py
│   │   ├── ml_categoriser.py
│   │   └── ai_insights_service.py
│   │
│   ├── repositories/        # Data access layer
│   │   ├── user_repo.py
│   │   ├── customer_repo.py
│   │   ├── inquiry_repo.py
│   │   ├── receipt_repo.py
│   │   ├── expense_repo.py
│   │   ├── invoice_repo.py
│   │   ├── payment_repo.py
│   │   └── transaction_repo.py
│   │
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── inquiry.py
│   │   ├── receipt.py
│   │   ├── expense.py
│   │   ├── invoice.py
│   │   ├── payment.py
│   │   ├── transaction.py
│   │   ├── tax_summary.py
│   │   └── audit_log.py
│   │
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── auth_schema.py
│   │   ├── customer_schema.py
│   │   ├── inquiry_schema.py
│   │   ├── receipt_schema.py
│   │   ├── expense_schema.py
│   │   ├── invoice_schema.py
│   │   ├── payment_schema.py
│   │   ├── transaction_schema.py
│   │   └── tax_schema.py
│   │
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings from .env
│   │   ├── database.py      # SQLAlchemy setup
│   │   └── security.py      # JWT & bcrypt
│   │
│   └── main.py              # FastAPI app entry point
│
├── Dockerfile               # Container setup
├── requirements.txt         # Python dependencies
└── .env.example             # Environment variables template
```

## Architecture

This backend follows a **3-layer architecture**:

1. **API Layer** (`api/`) - FastAPI routes and request validation
2. **Service Layer** (`services/`) - Business logic and domain rules
3. **Data Layer** (`repositories/`) - Database access

### Design Patterns Used

- **Strategy Pattern**: `tax_engine.py` uses different tax calculation strategies based on user role
- **Proxy Pattern**: `anonymiser.py` removes PII before sending data to external APIs

## Prerequisites

- Python 3.11+
- PostgreSQL 16
- Docker & Docker Compose (optional)

## Setup

### Using Docker Compose (Recommended)

```bash
# From project root
docker compose up
```

This will:
- Start PostgreSQL on port 5432
- Build and run the backend on port 8000
- Apply database migrations
- Auto-reload on code changes

### Manual Setup

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Set up database**:
```bash
# Assuming PostgreSQL is running
createdb spendly_db
psql spendly_db < ../database/init.sql
```

4. **Run the application**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`
Swagger UI docs: `http://localhost:8000/docs`

## API Endpoints

### Health Check
- `GET /api/v1/health` - Service health

### Authentication
- `POST /api/v1/auth/register` - Register user and receive access/refresh tokens
- `POST /api/v1/auth/login` - Login and receive access/refresh tokens
- `POST /api/v1/auth/refresh` - Exchange a refresh token for a new access token
- `POST /api/v1/auth/logout` - Revoke the current refresh token
- `GET /api/v1/auth/me` - Get the authenticated user profile

Password policy:
- Minimum 8 characters
- At least 1 letter and 1 digit

JWT access tokens last 15 minutes and refresh tokens last 7 days. Refresh tokens are stored in the database so logout can revoke them.

### Inquiries (Projects)
- `POST /api/v1/inquiries` - Create inquiry
- `GET /api/v1/inquiries` - List user's inquiries
- `GET /api/v1/inquiries/{id}` - Get inquiry details
- `PUT /api/v1/inquiries/{id}` - Update inquiry

### Receipts
- `POST /api/v1/receipts` - Create receipt
- `POST /api/v1/receipts/upload` - Upload receipt file
- `GET /api/v1/receipts` - List receipts
- `GET /api/v1/receipts/{id}` - Get receipt
- `PUT /api/v1/receipts/{id}` - Update receipt

### Expenses
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses` - List expenses
- `GET /api/v1/expenses/{id}` - Get expense
- `PUT /api/v1/expenses/{id}` - Update expense

### Invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/{id}` - Get invoice
- `PUT /api/v1/invoices/{id}` - Update invoice

### Payments
- `POST /api/v1/payments` - Record payment
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/{id}` - Get payment

### Transactions
- `POST /api/v1/transactions` - Import bank transaction
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/{id}` - Get transaction
- `PUT /api/v1/transactions/{id}` - Update reconciliation status

### Tax
- `GET /api/v1/tax/summary` - Get tax summary for period
- `POST /api/v1/tax/calculate` - Calculate taxes
- `GET /api/v1/tax/vat-return` - Get VAT3/RTD return
- `GET /api/v1/tax/annual-summary` - Get annual summary

### Insights
- `GET /api/v1/insights/spending` - Spending analysis
- `GET /api/v1/insights/tax-optimization` - Tax tips
- `GET /api/v1/insights/cash-flow` - Cash flow analysis

## User Roles

1. **self_employed_vat** - Runs business with VAT, files VAT3/RTD
2. **self_employed_no_vat** - Runs business, files annual summary
3. **paye_side_income** - Employee with freelance side income

## Authentication

The API uses JWT tokens. Include in request headers:
```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/v1/auth/login` or `/api/v1/auth/register`.

## Database Migrations

Using Alembic:

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Revert to previous
alembic downgrade -1
```

## Key Features Implemented

- ✅ Layered architecture (API → Services → Repositories)
- ✅ JWT authentication with bcrypt hashing
- ✅ CORS middleware for frontend integration
- ✅ Strategy Pattern for multi-role tax calculations
- ✅ Proxy Pattern for PII anonymization
- ✅ SQLAlchemy async ORM with PostgreSQL
- ✅ Pydantic schemas for validation
- ✅ Full CRUD operations on all entities
- ✅ Audit logging support
- ✅ Docker containerization

## Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Format code
black app/

# Linting
flake8 app/

# Type checking
mypy app/
```

## Notes

This is a scaffold implementation. The following features are placeholders:
- OCR service (`ocr_service.py`) - integrate with pytesseract or cloud APIs
- ML categorizer (`ml_categoriser.py`) - integrate with scikit-learn or OpenAI
- AI insights (`ai_insights_service.py`) - integrate with OpenAI API
- Tax calculations - business logic to be implemented per Irish tax rules

## License

Proprietary - Spendly Platform
