from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import DatabaseManager
from app.api.v1 import auth, inquiries, receipts, expenses, invoices, payments, transactions, tax, insights

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    DatabaseManager.initialize()
    yield
    # Shutdown
    await DatabaseManager.close()


# Create FastAPI app
app = FastAPI(
    title="Spendly API",
    description="Financial management platform for Irish taxpayers",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(inquiries.router, prefix="/api/v1")
app.include_router(receipts.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(tax.router, prefix="/api/v1")
app.include_router(insights.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
