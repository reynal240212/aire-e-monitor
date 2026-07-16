from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.models.models import init_db
from app.routes import facturas, lecturas, ocr, dashboard, alertas, scraper, predictor, upload
import os

app = FastAPI(title="AIRE-E Monitor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("pdfs", exist_ok=True)
os.makedirs("pdfs/calibration", exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="pdfs"), name="pdfs")

app.include_router(facturas.router, prefix="/api/facturas", tags=["Facturas"])
app.include_router(lecturas.router, prefix="/api/lecturas", tags=["Lecturas"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(alertas.router, prefix="/api/alertas", tags=["Alertas"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["Scraper"])
app.include_router(predictor.router, prefix="/api/predictor", tags=["Predictor"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"message": "AIRE-E Monitor API", "version": "1.0.0"}
