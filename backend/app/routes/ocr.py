from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from app.models.models import get_db, Medicion, Cliente, CalibrationData
from app.services.ocr_counter import ocr_instance
from datetime import date
from pydantic import BaseModel
from typing import Optional, Dict
import shutil
import os
import json

router = APIRouter()


class CalibrationRequest(BaseModel):
    client_id: int
    expected_reading: float
    region: Optional[Dict] = None


@router.post("/read-counter")
async def read_counter(image: UploadFile = File(...)):
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        result = ocr_instance.read_counter(temp_path)

        return {
            "success": result["reading_kwh"] is not None,
            "reading_kwh": result["reading_kwh"],
            "confidence": result["confidence"],
            "all_detections": result["all_detections"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/read-with-calibration/{client_id}")
async def read_with_calibration(client_id: int, image: UploadFile = File(...)):
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        result = ocr_instance.read_with_calibration(client_id, temp_path)

        return {
            "success": result["reading_kwh"] is not None,
            "reading_kwh": result["reading_kwh"],
            "confidence": result["confidence"],
            "calibration_used": ocr_instance.load_calibration(client_id) is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/calibrate")
async def calibrate_counter(
    image: UploadFile = File(...),
    expected_reading: float = Form(...),
    client_id: int = Form(default=1)
):
    temp_path = f"calibration_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        detected_region = ocr_instance.detect_display_region(temp_path)

        result = ocr_instance.calibrate(temp_path, expected_reading, detected_region)

        if result["success"]:
            ocr_instance.save_calibration(client_id, result, temp_path)

        return {
            "success": result["success"],
            "detected_reading": result["detected_reading"],
            "expected_reading": result["expected_reading"],
            "error": result["error"],
            "best_params": result["best_params"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/calibration-status/{client_id}")
async def get_calibration_status(client_id: int):
    calibration = ocr_instance.load_calibration(client_id)
    if calibration:
        return {
            "calibrated": True,
            "params": calibration.get("params"),
            "success": calibration.get("success")
        }
    return {"calibrated": False}


@router.post("/detect-region")
async def detect_display_region(image: UploadFile = File(...)):
    temp_path = f"temp_{image.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        region = ocr_instance.detect_display_region(temp_path)

        return {
            "success": region is not None,
            "region": region
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
