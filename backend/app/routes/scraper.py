from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.models import get_db, Cliente
from app.services.scraper import AireScraper
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ScrapeRequest(BaseModel):
    nic: str
    captcha_color: Optional[str] = None


@router.post("/run")
def run_scraper(request: ScrapeRequest, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.nic == request.nic).first()
    if not cliente:
        cliente = Cliente(nic=request.nic, nombre=f"Usuario {request.nic}")
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    scraper = AireScraper()
    try:
        result = scraper.scrape_invoices(request.nic, request.captcha_color)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        scraper.close()


@router.get("/status")
def get_scraper_status():
    return {
        "status": "ready",
        "url": "https://consultatufactura.air-e.com/",
        "message": "Scraper listo. El CAPTCHA requiere selección de color."
    }

@router.post("/debug-inspect")
def debug_inspect(nic: str = Query(...)):
    """Inspecciona la estructura de la página de AirE para debug"""
    from app.services.scraper import AireScraper
    scraper = AireScraper()
    try:
        result = scraper.inspect_page(nic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        scraper.close()

@router.post("/capture-captcha")
def capture_captcha(nic: str = Query(...)):
    """Captura la imagen del CAPTCHA de la página de AirE"""
    from app.services.scraper import AireScraper
    scraper = AireScraper()
    try:
        result = scraper.capture_captcha_image(nic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        scraper.close()


@router.post("/detect-color")
def detect_captcha_color(image_path: str):
    from app.services.scraper import AireScraper
    scraper = AireScraper()
    try:
        color = scraper.detect_captcha_color(image_path)
        return {"detected_color": color}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
