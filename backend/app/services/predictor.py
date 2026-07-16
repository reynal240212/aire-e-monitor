import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sqlalchemy.orm import Session
from app.models.models import Factura, Medicion, Cliente
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class ConsumptionPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.poly = PolynomialFeatures(degree=2)

    def get_historical_data(self, db: Session, client_id: int) -> pd.DataFrame:
        facturas = db.query(Factura).filter(
            Factura.cliente_id == client_id
        ).order_by(Factura.fecha_corte).all()

        if not facturas:
            return pd.DataFrame()

        data = []
        for f in facturas:
            data.append({
                'fecha': f.fecha_corte,
                'consumo_kwh': f.consumo_kwh,
                'valor_total': f.valor_total,
                'month': f.fecha_corte.month if f.fecha_corte else None,
                'year': f.fecha_corte.year if f.fecha_corte else None
            })

        return pd.DataFrame(data)

    def predict_next_month(self, db: Session, client_id: int) -> Dict:
        df = self.get_historical_data(db, client_id)

        if df.empty or len(df) < 2:
            return {
                "success": False,
                "message": "Datos insuficientes. Se necesitan al menos 2 facturas históricas."
            }

        df['month_num'] = range(1, len(df) + 1)

        X = df[['month_num']].values
        y_kwh = df['consumo_kwh'].values
        y_valor = df['valor_total'].values

        X_poly = self.poly.fit_transform(X)

        model_kwh = LinearRegression()
        model_kwh.fit(X_poly, y_kwh)

        model_valor = LinearRegression()
        model_valor.fit(X_poly, y_valor)

        next_month_num = len(df) + 1
        X_next = np.array([[next_month_num]])
        X_next_poly = self.poly.transform(X_next)

        predicted_kwh = max(0, model_kwh.predict(X_next_poly)[0])
        predicted_valor = max(0, model_valor.predict(X_next_poly)[0])

        r2_kwh = model_kwh.score(X_poly, y_kwh)
        r2_valor = model_valor.score(X_poly, y_valor)

        avg_kwh = df['consumo_kwh'].mean()
        avg_valor = df['valor_total'].mean()
        trend_kwh = "creciente" if predicted_kwh > avg_kwh else "decreciente"
        trend_valor = "creciente" if predicted_valor > avg_valor else "decreciente"

        tips = self._generate_tips(predicted_kwh, avg_kwh, trend_kwh, df)

        return {
            "success": True,
            "predicted_kwh": round(predicted_kwh, 2),
            "predicted_valor": round(predicted_valor, 2),
            "confidence_kwh": round(r2_kwh * 100, 1),
            "confidence_valor": round(r2_valor * 100, 1),
            "trend_kwh": trend_kwh,
            "trend_valor": trend_valor,
            "historical_avg_kwh": round(avg_kwh, 2),
            "historical_avg_valor": round(avg_valor, 2),
            "tips": tips,
            "data_points": len(df)
        }

    def _generate_tips(self, predicted_kwh: float, avg_kwh: float, trend: str, df: pd.DataFrame) -> List[str]:
        tips = []

        if predicted_kwh > avg_kwh * 1.1:
            tips.append("Tu consumo estimado supera el promedio. Revisa electrodomésticos de alto consumo.")

        if trend == "creciente":
            tips.append("El consumo está en tendencia creciente. Considera revisar el uso de aire acondicionado.")

        max_month = df.loc[df['consumo_kwh'].idxmax()]
        tips.append(f"Tu mayor consumo fue en el mes {max_month['month']} con {max_month['consumo_kwh']} kWh.")

        if predicted_kwh > 200:
            tips.append("Para consumos altos: revisa el refrigerador, calentador y aire acondicionado.")

        if predicted_kwh < 100:
            tips.append("Buen consumo. Mantén los hábitos actuales.")

        tips.append("Usa electrodomésticos clase A y apaga luces al salir.")

        return tips

    def analyze_patterns(self, db: Session, client_id: int) -> Dict:
        df = self.get_historical_data(db, client_id)

        if df.empty:
            return {"message": "Sin datos para analizar"}

        monthly_avg = df.groupby('month')['consumo_kwh'].mean()
        seasonal_pattern = {}
        for month, avg in monthly_avg.items():
            if month in [6, 7, 8]:
                seasonal_pattern[month] = "invierno"
            elif month in [12, 1, 2]:
                seasonal_pattern[month] = "verano"
            else:
                seasonal_pattern[month] = "transición"

        return {
            "monthly_averages": monthly_avg.to_dict(),
            "seasonal_pattern": seasonal_pattern,
            "total_records": len(df),
            "date_range": {
                "start": df['fecha'].min().isoformat(),
                "end": df['fecha'].max().isoformat()
            }
        }


predictor = ConsumptionPredictor()
