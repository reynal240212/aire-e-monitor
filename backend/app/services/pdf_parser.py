import pdfplumber
import re
from typing import Dict, Optional
from datetime import datetime


class PDFParser:
    def __init__(self):
        pass

    def extract_invoice_data(self, pdf_path: str) -> Dict:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""

                data = self._parse_text(full_text)
                data["pdf_path"] = pdf_path

                return data
        except Exception as e:
            return {"error": str(e), "pdf_path": pdf_path}

    def _parse_text(self, text: str) -> Dict:
        data = {
            "nic": None,
            "fecha_corte": None,
            "fecha_vencimiento": None,
            "valor_total": None,
            "consumo_kwh": None,
            "lectura_anterior": None,
            "lectura_actual": None,
            "estrato": None,
            "nombre_cliente": None,
            "direccion": None
        }

        nic_match = re.search(r'NIC[:\s]*(\d+)', text)
        if nic_match:
            data["nic"] = nic_match.group(1)

        date_patterns = [
            r'Fecha de Corte[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})',
            r'Corte[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})',
            r'(\d{2}[/-]\d{2}[/-]\d{4}).*corte',
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data["fecha_corte"] = datetime.strptime(match.group(1), "%d/%m/%Y").date()
                except:
                    pass
                break

        venc_patterns = [
            r'Vencimiento[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})',
            r'Fecha Límite[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})',
            r'Pague antes del[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})',
        ]
        for pattern in venc_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data["fecha_vencimiento"] = datetime.strptime(match.group(1), "%d/%m/%Y").date()
                except:
                    pass
                break

        value_patterns = [
            r'Total a Pagar[:\s]*\$?([\d.,]+)',
            r'Valor Total[:\s]*\$?([\d.,]+)',
            r'TOTAL[:\s]*\$?([\d.,]+)',
            r'Neto a Pagar[:\s]*\$?([\d.,]+)',
        ]
        for pattern in value_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value_str = match.group(1).replace('.', '').replace(',', '.')
                try:
                    data["valor_total"] = float(value_str)
                except:
                    pass
                break

        consumption_patterns = [
            r'Consumo[:\s]*([\d.,]+)\s*kWh',
            r'([\d.,]+)\s*kWh',
            r'Consumo\s+kWh[:\s]*([\d.,]+)',
        ]
        for pattern in consumption_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data["consumo_kwh"] = float(match.group(1).replace(',', '.'))
                except:
                    pass
                break

        lect_patterns = [
            r'Lectura\s+Anterior[:\s]*([\d.,]+)',
            r'Anterior[:\s]*([\d.,]+)',
        ]
        for pattern in lect_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data["lectura_anterior"] = float(match.group(1).replace(',', '.'))
                except:
                    pass
                break

        lect_act_patterns = [
            r'Lectura\s+Actual[:\s]*([\d.,]+)',
            r'Actual[:\s]*([\d.,]+)',
        ]
        for pattern in lect_act_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data["lectura_actual"] = float(match.group(1).replace(',', '.'))
                except:
                    pass
                break

        estrato_match = re.search(r'Estrato[:\s]*(\d)', text)
        if estrato_match:
            data["estrato"] = int(estrato_match.group(1))

        return data


pdf_parser = PDFParser()
