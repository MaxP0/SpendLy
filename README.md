# Spendly Demo

Minimal mid-point demo for the "Spendly" FYP.

Focus: simple auth, navigation, static dashboard, and a working receipt upload with OCR (mock fallback).

## Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: FastAPI (Python)
- DB: SQLite (for demo)
- OCR: Tesseract via `pytesseract` (fallback to mock)

## Setup

### Backend
1. Create a virtual environment and install deps:

```zsh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the API:

```zsh
uvicorn app.main:app --reload --port 8000
```

### Frontend

1. Install deps and run dev server:

```zsh
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173` and backend on `http://localhost:8000`.

## Demo Flow
1. Use a seeded demo user or register a new one.
	 - Seeded users:
		 - demo@spendly.test / demo123
		 - alice@spendly.test / alice123
		 - bob@spendly.test / bob123
2. Login; you will be redirected to `/dashboard`.
3. Use the sidebar to show system modules.
4. Go to `Receipts & Expenses`, upload an image or PDF.
5. See raw OCR text, extracted amount/date, and status message. If OCR fails or Tesseract is missing, mock values are returned. Uploading a `.txt` file will display its contents as raw text for quick verification.

## Notes
- This is a demo; security is minimal (JWT token, bcrypt hashing).
- Database is SQLite; stored in `backend/app.db`.
- Uploads are saved to `backend/uploads/`.
- Tailwind neutral styling with simple layout.
