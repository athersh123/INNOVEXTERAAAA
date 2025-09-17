from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import io

try:
    import pytesseract  # type: ignore
    from PIL import Image  # type: ignore
except Exception:  # pragma: no cover - optional at runtime
    pytesseract = None
    Image = None

from config import settings


class LandParcel(BaseModel):
    parcel_id: str
    holder_id: str
    holder_name: str
    area_ha: float
    land_use: List[str]
    village: str
    state: str
    geometry: Dict[str, Any]
    claim_status: str


class OcrResponse(BaseModel):
    text: str


class EligibilityRequest(BaseModel):
    holder_id: str


class EligibilityResult(BaseModel):
    holder_id: str
    eligible_schemes: List[str]
    notes: Optional[str] = None


app = FastAPI(title="FRA Atlas API", default_response_class=settings.FastJsonResponse)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_records() -> List[LandParcel]:
    with open(settings.DATA_PATH / "sample_records.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return [LandParcel(**r) for r in data]


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/records", response_model=List[LandParcel])
def get_records() -> List[LandParcel]:
    return load_records()


@app.get("/api/records/{holder_id}", response_model=List[LandParcel])
def get_records_by_holder(holder_id: str) -> List[LandParcel]:
    return [r for r in load_records() if r.holder_id == holder_id]


@app.get("/api/search", response_model=List[LandParcel])
def search_records(q: str) -> List[LandParcel]:
    ql = q.lower()
    return [
        r for r in load_records()
        if ql in r.holder_name.lower() or ql in r.village.lower() or ql in r.parcel_id.lower()
    ]


@app.post("/api/ocr", response_model=OcrResponse)
async def ocr_image(file: UploadFile = File(...)) -> OcrResponse:
    if pytesseract is None or Image is None:
        raise HTTPException(status_code=500, detail="OCR not available. Install Tesseract and Pillow.")
    content = await file.read()
    image = Image.open(io.BytesIO(content))
    text = pytesseract.image_to_string(image, lang=settings.OCR_LANG)
    return OcrResponse(text=text)


def compute_eligibility_for(holder_id: str) -> EligibilityResult:
    records = [r for r in load_records() if r.holder_id == holder_id]
    eligible: List[str] = []

    # PM-Kisan: farmland with non-zero area
    has_farmland = any("farmland" in r.land_use and r.area_ha >= 0.1 for r in records)
    if has_farmland:
        eligible.append("PM-Kisan")

    # Jal Shakti: presence of ponds or lakes
    water_resources = any(any(tag in ("pond", "lake") for tag in r.land_use) for r in records)
    if water_resources:
        eligible.append("Jal Shakti - Water Resource Development")

    # Forest-based livelihood support if CFR claimed and approved
    has_cfr_approved = any(r.claim_status.lower() == "approved" and "cfr" in r.land_use for r in records)
    if has_cfr_approved:
        eligible.append("CFR Livelihood Support")

    notes = None
    if not eligible:
        notes = "No eligible schemes found based on current records."
    return EligibilityResult(holder_id=holder_id, eligible_schemes=eligible, notes=notes)


@app.post("/api/dss/eligibility", response_model=EligibilityResult)
def dss_eligibility(req: EligibilityRequest) -> EligibilityResult:
    return compute_eligibility_for(req.holder_id)



