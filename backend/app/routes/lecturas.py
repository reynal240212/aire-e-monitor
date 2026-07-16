from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.models import get_db, Medicion, Cliente
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

router = APIRouter()


class MedicionCreate(BaseModel):
    client_id: int
    fecha: date
    lectura_kwh: float
    fuente: str = "manual"
    imagen_path: Optional[str] = None
    confianza_ocr: Optional[float] = None


@router.get("/{client_id}")
def list_mediciones(client_id: int, limit: int = 30, db: Session = Depends(get_db)):
    mediciones = db.query(Medicion).filter(
        Medicion.cliente_id == client_id
    ).order_by(Medicion.fecha.desc()).limit(limit).all()

    return [{
        "id": m.id,
        "fecha": m.fecha.isoformat(),
        "lectura_kwh": m.lectura_kwh,
        "fuente": m.fuente,
        "confianza_ocr": m.confianza_ocr
    } for m in mediciones]


@router.post("/")
def create_medicion(medicion: MedicionCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == medicion.client_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    existing = db.query(Medicion).filter(
        Medicion.cliente_id == medicion.client_id,
        Medicion.fecha == medicion.fecha
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una medición para esta fecha")

    db_medicion = Medicion(
        cliente_id=medicion.client_id,
        fecha=medicion.fecha,
        lectura_kwh=medicion.lectura_kwh,
        fuente=medicion.fuente,
        imagen_path=medicion.imagen_path,
        confianza_ocr=medicion.confianza_ocr
    )
    db.add(db_medicion)
    db.commit()
    db.refresh(db_medicion)

    return {"id": db_medicion.id, "message": "Medición registrada"}


@router.get("/{client_id}/stats")
def get_stats(client_id: int, db: Session = Depends(get_db)):
    mediciones = db.query(Medicion).filter(
        Medicion.cliente_id == client_id
    ).order_by(Medicion.fecha).all()

    if not mediciones:
        return {"message": "Sin datos de medición"}

    readings = [m.lectura_kwh for m in mediciones]

    daily_consumption = []
    for i in range(1, len(mediciones)):
        diff = mediciones[i].lectura_kwh - mediciones[i-1].lectura_kwh
        if diff >= 0:
            daily_consumption.append({
                "fecha": mediciones[i].fecha.isoformat(),
                "consumo": round(diff, 2)
            })

    return {
        "total_lecturas": len(mediciones),
        "lectura_actual": readings[-1] if readings else 0,
        "lectura_minima": min(readings) if readings else 0,
        "lectura_maxima": max(readings) if readings else 0,
        "consumo_diario": daily_consumption
    }


@router.delete("/{medicion_id}")
def delete_medicion(medicion_id: int, db: Session = Depends(get_db)):
    medicion = db.query(Medicion).filter(Medicion.id == medicion_id).first()
    if not medicion:
        raise HTTPException(status_code=404, detail="Medición no encontrada")

    db.delete(medicion)
    db.commit()
    return {"message": "Medición eliminada"}
