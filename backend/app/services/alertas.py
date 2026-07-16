from sqlalchemy.orm import Session
from app.models.models import Alerta, Cliente, Factura, Medicion
from datetime import datetime, timedelta
from typing import List, Dict


class AlertService:
    def __init__(self):
        self.thresholds = {
            "consumo_alto_percent": 20,
            "consumo_max_kwh": 300,
            "dias_vencimiento": 5,
            "variacion_mayor_percent": 30
        }

    def check_consumption_alerts(self, db: Session, client_id: int) -> List[Dict]:
        alerts = []

        facturas = db.query(Factura).filter(
            Factura.cliente_id == client_id
        ).order_by(Factura.fecha_corte.desc()).limit(3).all()

        if len(facturas) >= 2:
            current = facturas[0]
            previous = facturas[1]

            if current.consumo_kwh and previous.consumo_kwh:
                change = ((current.consumo_kwh - previous.consumo_kwh) / previous.consumo_kwh) * 100

                if change > self.thresholds["consumo_alto_percent"]:
                    alerts.append({
                        "tipo": "consumo_alto",
                        "mensaje": f"Tu consumo subió {change:.1f}% vs el mes anterior ({current.consumo_kwh} kWh vs {previous.consumo_kwh} kWh)",
                        "severity": "high"
                    })

                if change < -self.thresholds["consumo_alto_percent"]:
                    alerts.append({
                        "tipo": "consumo_bajo",
                        "mensaje": f"Excelente! Tu consumo bajó {abs(change):.1f}% ({current.consumo_kwh} kWh)",
                        "severity": "positive"
                    })

        if facturas and facturas[0].consumo_kwh:
            if facturas[0].consumo_kwh > self.thresholds["consumo_max_kwh"]:
                alerts.append({
                    "tipo": "consumo_excesivo",
                    "mensaje": f"Consumo muy alto: {facturas[0].consumo_kwh} kWh. Revisa electrodomésticos.",
                    "severity": "critical"
                })

        return alerts

    def check_due_date_alerts(self, db: Session, client_id: int) -> List[Dict]:
        alerts = []

        facturas = db.query(Factura).filter(
            Factura.cliente_id == client_id,
            Factura.fecha_vencimiento >= datetime.now().date()
        ).order_by(Factura.fecha_vencimiento).limit(1).all()

        if facturas:
            vencimiento = facturas[0].fecha_vencimiento
            dias_restantes = (vencimiento - datetime.now().date()).days

            if dias_restantes <= self.thresholds["dias_vencimiento"]:
                alerts.append({
                    "tipo": "vencimiento",
                    "mensaje": f"Tu factura vence en {dias_restantes} días ({vencimiento})",
                    "severity": "warning"
                })

            if dias_restantes <= 0:
                alerts.append({
                    "tipo": "vencido",
                    "mensaje": "Tu factura está vencida! Realiza el pago lo antes posible.",
                    "severity": "critical"
                })

        return alerts

    def check_prediction_alerts(self, db: Session, client_id: int) -> List[Dict]:
        alerts = []

        facturas = db.query(Factura).filter(
            Factura.cliente_id == client_id
        ).order_by(Factura.fecha_corte.desc()).limit(6).all()

        if len(facturas) >= 2:
            avg_valor = sum(f.valor_total for f in facturas if f.valor_total) / len(facturas)
            last_valor = facturas[0].valor_total if facturas[0].valor_total else 0

            if last_valor > avg_valor * 1.3:
                alerts.append({
                    "tipo": "prediccion",
                    "mensaje": f"Última factura ({last_valor:,.0f}) superó el promedio ({avg_valor:,.0f}). Considera reducir consumo.",
                    "severity": "warning"
                })

        return alerts

    def get_all_alerts(self, db: Session, client_id: int) -> List[Dict]:
        all_alerts = []
        all_alerts.extend(self.check_consumption_alerts(db, client_id))
        all_alerts.extend(self.check_due_date_alerts(db, client_id))
        all_alerts.extend(self.check_prediction_alerts(db, client_id))

        all_alerts.sort(key=lambda x: {
            "critical": 0,
            "high": 1,
            "warning": 2,
            "positive": 3
        }.get(x.get("severity", ""), 4))

        return all_alerts

    def save_alert(self, db: Session, client_id: int, alert: Dict):
        db_alert = Alerta(
            cliente_id=client_id,
            tipo=alert["tipo"],
            mensaje=alert["mensaje"]
        )
        db.add(db_alert)
        db.commit()

    def mark_as_read(self, db: Session, alert_id: int):
        alert = db.query(Alerta).filter(Alerta.id == alert_id).first()
        if alert:
            alert.leida = True
            db.commit()

    def get_unread_count(self, db: Session, client_id: int) -> int:
        return db.query(Alerta).filter(
            Alerta.cliente_id == client_id,
            Alerta.leida == False
        ).count()


alert_service = AlertService()
