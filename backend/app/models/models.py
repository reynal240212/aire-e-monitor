from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from app.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nic = Column(String(20), unique=True, index=True, nullable=False)
    nombre = Column(String(100))
    direccion = Column(Text)
    estrato = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.now)

    facturas = relationship("Factura", back_populates="cliente")
    mediciones = relationship("Medicion", back_populates="cliente")
    alertas = relationship("Alerta", back_populates="cliente")
    predicciones = relationship("Prediccion", back_populates="cliente")
    calibration = relationship("CalibrationData", back_populates="cliente")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    fecha_corte = Column(Date)
    fecha_vencimiento = Column(Date)
    valor_total = Column(Float)
    consumo_kwh = Column(Float)
    lectura_anterior = Column(Float)
    lectura_actual = Column(Float)
    estrato = Column(Integer)
    pdf_path = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    cliente = relationship("Cliente", back_populates="facturas")


class Medicion(Base):
    __tablename__ = "mediciones"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    fecha = Column(Date, nullable=False)
    lectura_kwh = Column(Float, nullable=False)
    fuente = Column(String(20))  # 'manual', 'camera', 'scraper'
    imagen_path = Column(Text, nullable=True)
    confianza_ocr = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    cliente = relationship("Cliente", back_populates="mediciones")


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    tipo = Column(String(50))  # 'consumo_alto', 'vencimiento', 'prediccion'
    mensaje = Column(Text)
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    cliente = relationship("Cliente", back_populates="alertas")


class Prediccion(Base):
    __tablename__ = "predicciones"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    fecha_prediccion = Column(Date)
    mes_proximo = Column(Date)
    valor_estimado = Column(Float)
    consumo_estimado_kwh = Column(Float)
    confianza = Column(Float)
    created_at = Column(DateTime, default=datetime.now)

    cliente = relationship("Cliente", back_populates="predicciones")


class CalibrationData(Base):
    __tablename__ = "calibration_data"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    imagen_path = Column(Text)
    lectura_esperada = Column(Float)
    region_display = Column(Text)  # JSON: {x, y, width, height}
    brillo = Column(Integer, default=0)
    contraste = Column(Integer, default=2)
    umbral_binario = Column(Integer, default=128)
    exito = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

    cliente = relationship("Cliente", back_populates="calibration")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
