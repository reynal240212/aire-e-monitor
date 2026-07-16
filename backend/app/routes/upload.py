from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.models.models import get_db, Cliente, Factura
from typing import Optional
import os
import shutil
import uuid
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "./pdfs/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    nic: str = Form(...),
    periodo: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Sube un PDF de factura manualmente al sistema."""
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse(status_code=400, content={"success": False, "detail": "Solo se permiten archivos PDF"})

    # Buscar o crear cliente por NIC
    cliente = db.query(Cliente).filter(Cliente.nic == nic).first()
    if not cliente:
        cliente = Cliente(nic=nic, nombre=f"Cliente {nic}")
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    # Nombre único para el archivo
    safe_periodo = (periodo or datetime.now().strftime("%Y-%m")).replace("-", "")
    unique_name = f"{nic}_{safe_periodo}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Guardar en disco
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "detail": f"Error guardando archivo: {str(e)}"})

    file_size_kb = round(os.path.getsize(file_path) / 1024, 1)

    # Parsear periodo a fecha_corte (primer día del mes)
    fecha_corte = None
    if periodo:
        try:
            fecha_corte = datetime.strptime(periodo, "%Y-%m").date()
        except Exception:
            pass

    # Registrar en BD usando campos reales del modelo Factura
    factura = Factura(
        cliente_id=cliente.id,
        fecha_corte=fecha_corte,
        pdf_path=file_path,
        created_at=datetime.now()
    )
    db.add(factura)
    db.commit()
    db.refresh(factura)

    return {
        "success": True,
        "message": "PDF subido correctamente",
        "factura_id": factura.id,
        "cliente_id": cliente.id,
        "nic": nic,
        "filename": unique_name,
        "path": file_path,
        "size_kb": file_size_kb
    }


@router.get("/uploads")
def list_uploads(db: Session = Depends(get_db)):
    """Lista todos los PDFs subidos."""
    facturas = db.query(Factura).filter(
        Factura.pdf_path.isnot(None)
    ).order_by(Factura.created_at.desc()).limit(50).all()

    result = []
    for f in facturas:
        cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
        pdf_exists = bool(f.pdf_path and os.path.exists(f.pdf_path))
        periodo = f.fecha_corte.strftime("%Y-%m") if f.fecha_corte else None
        result.append({
            "id": f.id,
            "nic": cliente.nic if cliente else "?",
            "nombre": cliente.nombre if cliente else "?",
            "periodo": periodo,
            "filename": os.path.basename(f.pdf_path) if f.pdf_path else None,
            "pdf_exists": pdf_exists,
            "fecha": f.created_at.isoformat() if f.created_at else None,
            "size_kb": round(os.path.getsize(f.pdf_path) / 1024, 1) if pdf_exists else 0
        })
    return result


@router.delete("/uploads/{factura_id}")
def delete_upload(factura_id: int, db: Session = Depends(get_db)):
    """Elimina un PDF subido."""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if factura.pdf_path and os.path.exists(factura.pdf_path):
        os.remove(factura.pdf_path)
    db.delete(factura)
    db.commit()
    return {"success": True, "message": "Factura eliminada"}
