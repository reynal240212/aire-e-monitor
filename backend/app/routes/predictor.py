from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.models import get_db
from app.services.predictor import predictor

router = APIRouter()


@router.get("/{client_id}")
def get_prediction(client_id: int, db: Session = Depends(get_db)):
    result = predictor.predict_next_month(db, client_id)
    return result


@router.get("/{client_id}/patterns")
def get_patterns(client_id: int, db: Session = Depends(get_db)):
    result = predictor.analyze_patterns(db, client_id)
    return result
