from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.models import get_db, Factura, Medicion, Cliente, Alerta
from app.services.predictor import predictor
from app.services.alertas import alert_service
from datetime import datetime

router = APIRouter()


@router.get("/{client_id}")
def get_dashboard(client_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == client_id).first()
    if not cliente:
        return {"error": "Cliente no encontrado"}

    facturas = db.query(Factura).filter(
        Factura.cliente_id == client_id
    ).order_by(Factura.fecha_corte.desc()).limit(12).all()

    mediciones = db.query(Medicion).filter(
        Medicion.cliente_id == client_id
    ).order_by(Medicion.fecha.desc()).limit(30).all()

    prediction = predictor.predict_next_month(db, client_id)

    alerts = alert_service.get_all_alerts(db, client_id)
    unread_count = alert_service.get_unread_count(db, client_id)

    count = len(facturas)
    total_consumo = sum(f.consumo_kwh or 0 for f in facturas)
    total_pagado = sum(f.valor_total or 0 for f in facturas)

    monthly_data = []
    for f in reversed(facturas):
        monthly_data.append({
            "month": f.fecha_corte.strftime("%b %Y") if f.fecha_corte else "N/A",
            "consumo_kwh": f.consumo_kwh or 0,
            "valor_total": f.valor_total or 0
        })

    return {
        "cliente": {
            "id": cliente.id,
            "nic": cliente.nic,
            "nombre": cliente.nombre,
            "estrato": cliente.estrato
        },
        "monthly_data": monthly_data,
        "total_facturas": count,
        "ultima_lectura": mediciones[0].lectura_kwh if mediciones else None,
        "prediction": prediction,
        "alerts": alerts,
        "unread_alerts": unread_count,
        "summary": {
            "total_consumo": total_consumo,
            "promedio_consumo": round(total_consumo / count, 2) if count else 0,
            "total_pagado": total_pagado,
            "promedio_pago": round(total_pagado / count, 2) if count else 0
        }
    }


@router.get("/{client_id}/trends")
def get_trends(client_id: int, db: Session = Depends(get_db)):
    facturas = db.query(Factura).filter(
        Factura.cliente_id == client_id
    ).order_by(Factura.fecha_corte).all()

    if len(facturas) < 2:
        return {"message": "Datos insuficientes para tendencias"}

    months = []
    consumos = []
    valores = []

    for f in facturas:
        months.append(f.fecha_corte.strftime("%b %Y") if f.fecha_corte else "N/A")
        consumos.append(f.consumo_kwh or 0)
        valores.append(f.valor_total or 0)

    consumo_trend = consumos[-1] - consumos[-2] if len(consumos) >= 2 else 0
    valor_trend = valores[-1] - valores[-2] if len(valores) >= 2 else 0

    return {
        "months": months,
        "consumos": consumos,
        "valores": valores,
        "consumo_trend": round(consumo_trend, 2),
        "valor_trend": round(valor_trend, 2),
        "consumo_trend_percent": round((consumo_trend / consumos[-2] * 100) if consumos[-2] else 0, 1),
        "valor_trend_percent": round((valor_trend / valores[-2] * 100) if valores[-2] else 0, 1)
    }
