from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import ColorExtractionResponse

router = APIRouter(prefix="/color", tags=["color"])

@router.post("/extract-color", response_model=ColorExtractionResponse)
async def extract_color(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Not implemented")
