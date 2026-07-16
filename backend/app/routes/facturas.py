from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.models import get_db, Cliente
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ClienteCreate(BaseModel):
    nic: str
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    estrato: Optional[int] = 3


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    estrato: Optional[int] = None


@router.get("/")
def list_clientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente).all()
    return [{"id": c.id, "nic": c.nic, "nombre": c.nombre, "estrato": c.estrato} for c in clientes]


@router.get("/{client_id}")
def get_cliente(client_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == client_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {
        "id": cliente.id,
        "nic": cliente.nic,
        "nombre": cliente.nombre,
        "direccion": cliente.direccion,
        "estrato": cliente.estrato
    }


@router.post("/")
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    existing = db.query(Cliente).filter(Cliente.nic == cliente.nic).first()
    if existing:
        raise HTTPException(status_code=400, detail="NIC ya registrado")

    db_cliente = Cliente(
        nic=cliente.nic,
        nombre=cliente.nombre,
        direccion=cliente.direccion,
        estrato=cliente.estrato
    )
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)

    return {"id": db_cliente.id, "nic": db_cliente.nic, "message": "Cliente creado"}


@router.put("/{client_id}")
def update_cliente(client_id: int, cliente: ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = db.query(Cliente).filter(Cliente.id == client_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.nombre is not None:
        db_cliente.nombre = cliente.nombre
    if cliente.direccion is not None:
        db_cliente.direccion = cliente.direccion
    if cliente.estrato is not None:
        db_cliente.estrato = cliente.estrato

    db.commit()
    return {"message": "Cliente actualizado"}
