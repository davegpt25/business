from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import ColorExtractionResponse, ItemAnalysisResponse

router = APIRouter()

@router.post("/extract-color", response_model=ColorExtractionResponse)
async def extract_color(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/analyze-item", response_model=ItemAnalysisResponse)
async def analyze_item(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Not implemented")
