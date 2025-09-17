from pathlib import Path
from fastapi.responses import ORJSONResponse


class Settings:
    BASE_DIR = Path(__file__).resolve().parent
    DATA_PATH = BASE_DIR / "data"
    OCR_LANG = "eng"
    FastJsonResponse = ORJSONResponse


settings = Settings()



