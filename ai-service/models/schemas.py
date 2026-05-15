from pydantic import BaseModel
from typing import List, Optional

class ColorInfo(BaseModel):
    hex: str          # "#FF5733"
    rgb: List[int]    # [255, 87, 51]
    percentage: float # 0.42 (전체 픽셀 중 비율)
    name: str         # "warm-red" (색상 계열명)

class ColorExtractionResponse(BaseModel):
    primary_color: ColorInfo
    secondary_colors: List[ColorInfo]  # 최대 4개
    dominant_palette: List[str]        # hex 코드 리스트

class TaggingResponse(BaseModel):
    style_keywords: List[str]   # ["캐주얼", "루즈핏"]
    fit_type: str               # "오버사이즈", "슬림", "레귤러"
    material_hint: str          # "니트", "데님", "면"

class ItemAnalysisResponse(BaseModel):
    colors: ColorExtractionResponse
    tags: TaggingResponse
