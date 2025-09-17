FRA Atlas Prototype

Overview
- Python FastAPI backend: OCR (pytesseract), simple DSS eligibility rules, records API
- Frontend: HTML/CSS/JS with Leaflet map, dashboard cards and charts

Quickstart
1) Backend (Python 3.10+)
   - Create venv and install deps:
     python -m venv .venv
     .venv\\Scripts\\activate
     pip install -r backend\\requirements.txt
   - Run API:
     uvicorn backend.app:app --reload

2) Frontend
   - Open frontend\\index.html in a Live Server (or any static server). If using VS Code Live Server, it will serve at http://127.0.0.1:5500 by default. Update API_BASE in frontend\\js\\api.js if needed.

Notes
- OCR requires Tesseract installed locally. On Windows install from https://github.com/UB-Mannheim/tesseract/wiki and ensure the binary is on PATH. Configure TESSERACT_CMD in backend\\config.py if needed.
- Sample data is in backend\\data\\sample_records.json and frontend uses GeoJSON in frontend\\data\\parcels.geojson.



