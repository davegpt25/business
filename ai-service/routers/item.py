from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import ItemAnalysisResponse

router = APIRouter(prefix="/item", tags=["item"])

@router.post("/analyze-item", response_model=ItemAnalysisResponse)
async def analyze_item(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Not implemented")
