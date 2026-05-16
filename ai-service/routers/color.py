from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool
from models.schemas import ColorExtractionResponse, ColorInfo
from services.color_extractor import extract_colors

router = APIRouter(prefix="/color", tags=["color"])

@router.post("/extract-color", response_model=ColorExtractionResponse)
async def extract_color_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다.")
    try:
        result = await run_in_threadpool(extract_colors, image_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="이미지를 처리할 수 없습니다.")
    primary = ColorInfo(
        hex=result["primary"]["hex"],
        rgb=result["primary"]["rgb"],
        percentage=result["primary"]["percentage"],
        name=result["primary"]["name"],
    )
    secondary = [
        ColorInfo(hex=c["hex"], rgb=c["rgb"], percentage=c["percentage"], name=c["name"])
        for c in result["secondary"]
    ]
    return ColorExtractionResponse(
        primary_color=primary,
        secondary_colors=secondary,
        dominant_palette=result["dominant_palette"],
    )
