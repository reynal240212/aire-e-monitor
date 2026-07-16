# AIRE-E Monitor

Monitoreo de consumo eléctrico con escaneo de contadores, OCR, scraping de facturas Air-E y predicción de consumo.

## Stack

- **Backend:** Python + FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS + Recharts
- **OCR:** EasyOCR + OpenCV
- **Scraper:** Selenium + ChromeDriver

## Requisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL (base de datos `aire_monitor`)
- Google Chrome (para scraper de facturas)

## Configuración

### 1. Base de datos

Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE aire_monitor;
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate
pip install -r requirements.txt
```

Crea `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/aire_monitor
NIC_DEFAULT=7566507
SCRAPER_CRON=0 8 28 * *
PDF_DIR=./pdfs
CALIBRATION_DIR=./pdfs/calibration
```

Inicia el servidor:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Inicio rápido

Ejecuta `start.ps1` para lanzar backend y frontend en ventanas separadas:

```powershell
.\start.ps1
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Docs API: http://localhost:8000/docs

## Estructura del proyecto

```
aire-e-monitor/
├── backend/
│   ├── app/
│   │   ├── main.py              # Punto de entrada FastAPI
│   │   ├── config.py            # Configuración con pydantic-settings
│   │   ├── models/
│   │   │   └── models.py        # Modelos SQLAlchemy
│   │   ├── routes/              # Endpoints de la API
│   │   │   ├── facturas.py      # CRUD clientes
│   │   │   ├── lecturas.py      # Mediciones del contador
│   │   │   ├── dashboard.py     # Dashboard consolidado
│   │   │   ├── ocr.py           # OCR de contadores
│   │   │   ├── scraper.py       # Scraper facturas Air-E
│   │   │   ├── predictor.py     # Predicción de consumo
│   │   │   ├── alertas.py       # Alertas del sistema
│   │   │   └── upload.py        # Subida de PDFs
│   │   └── services/
│   │       ├── ocr_counter.py   # Lector de contador con EasyOCR
│   │       ├── scraper.py       # Selenium scraper
│   │       ├── predictor.py     # Regresión polinomial
│   │       ├── pdf_parser.py    # Parseo de PDFs
│   │       └── alertas.py       # Motor de alertas
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Layout + navegación
│   │   ├── components/
│   │   │   ├── Dashboard.jsx    # KPIs + gráficos
│   │   │   ├── CameraReader.jsx # Captura de contador
│   │   │   ├── ManualInput.jsx  # Ingreso manual
│   │   │   ├── ScraperPanel.jsx # Descarga facturas Air-E
│   │   │   ├── AlertList.jsx    # Alertas
│   │   │   ├── TipsPanel.jsx    # Consejos
│   │   │   └── UploadPanel.jsx  # Subida PDFs
│   │   └── index.css            # Tema cyberpunk
│   ├── package.json
│   └── vite.config.js
├── start.ps1                    # Lanzador
└── README.md
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/{id}` | Dashboard completo del cliente |
| GET | `/api/facturas/` | Listar clientes |
| POST | `/api/facturas/` | Registrar cliente |
| POST | `/api/lecturas/` | Registrar medición manual |
| POST | `/api/ocr/read-counter` | Leer contador desde imagen |
| POST | `/api/scraper/run` | Descargar facturas desde Air-E |
| POST | `/api/upload/upload` | Subir PDF de factura |
| GET | `/api/predictor/{id}` | Predicción de próxima factura |
| GET | `/api/alertas/{id}` | Alertas del cliente |

## Notas

- El scraper de Air-E usa Selenium en modo headless. Requiere Chrome instalado.
- EasyOCR descarga modelos ~1GB en la primera ejecución.
- El CAPTCHA de Air-E se resuelve detectando el color automáticamente; si falla, se puede seleccionar manualmente desde el frontend.
