from pathlib import Path
from typing import Dict

from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import router as auth_router, get_current_user
from .database import Base, engine, get_db
from .ocr import process_receipt
from .schemas import OCRResult, UserOut
from .models import User
from .auth import get_password_hash


UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Spendly Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    # Seed demo users
    with Session(bind=engine) as db:
        for email, pwd in [
            ("demo@spendly.test", "demo123"),
            ("alice@spendly.test", "alice123"),
            ("bob@spendly.test", "bob123"),
        ]:
            if not db.query(User).filter(User.email == email).first():
                user = User(email=email, password_hash=get_password_hash(pwd))
                db.add(user)
        db.commit()


app.include_router(auth_router)


@app.post("/receipts/upload", response_model=OCRResult)
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    # Save file
    safe_name = file.filename or "upload"
    target_path = UPLOAD_DIR / safe_name
    content = await file.read()
    target_path.write_bytes(content)

    amount, date, raw_text, message = process_receipt(str(target_path))
    return OCRResult(filename=safe_name, raw_text=raw_text, amount=amount, date=date, message=message)


@app.get("/health", response_model=Dict[str, str])
def health() -> Dict[str, str]:
    return {"status": "ok"}
