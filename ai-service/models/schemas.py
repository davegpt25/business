from pydantic import BaseModel, field_validator, Field
from typing import List

class ColorInfo(BaseModel):
    hex: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')  # "#FF5733"
    rgb: List[int]    # [255, 87, 51]
    percentage: float = Field(..., ge=0.0, le=1.0)  # 0.42
    name: str         # "warm-red"

    @field_validator('rgb')
    @classmethod
    def check_rgb(cls, v: List[int]) -> List[int]:
        if len(v) != 3:
            raise ValueError('rgb must have exactly 3 elements')
        for channel in v:
            if not (0 <= channel <= 255):
                raise ValueError(f'rgb channel value {channel} is out of range 0-255')
        return v

class ColorExtractionResponse(BaseModel):
    primary_color: ColorInfo
    secondary_colors: List[ColorInfo]  # max 4
    dominant_palette: List[str]        # hex code list

class TaggingResponse(BaseModel):
    style_keywords: List[str]
    fit_type: str
    material_hint: str

class ItemAnalysisResponse(BaseModel):
    colors: ColorExtractionResponse
    tags: TaggingResponse
