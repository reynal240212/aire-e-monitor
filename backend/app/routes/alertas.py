from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.models import get_db
from app.services.alertas import alert_service

router = APIRouter()


@router.get("/{client_id}")
def get_alerts(client_id: int, db: Session = Depends(get_db)):
    alerts = alert_service.get_all_alerts(db, client_id)
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/{client_id}/unread")
def get_unread_count(client_id: int, db: Session = Depends(get_db)):
    count = alert_service.get_unread_count(db, client_id)
    return {"unread_count": count}


@router.put("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert_service.mark_as_read(db, alert_id)
    return {"message": "Alerta marcada como leída"}


@router.post("/{client_id}/check")
def check_alerts(client_id: int, db: Session = Depends(get_db)):
    alerts = alert_service.get_all_alerts(db, client_id)
    saved = []
    for alert in alerts:
        alert_service.save_alert(db, client_id, alert)
        saved.append(alert)
    return {"new_alerts": len(saved), "alerts": saved}
