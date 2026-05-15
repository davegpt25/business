import pytest
import numpy as np
from PIL import Image
import io
from services.color_extractor import extract_colors, rgb_to_hex, get_color_name

def make_test_image(colors: list, size=(100, 100)) -> bytes:
    """단색 또는 다색 테스트 이미지 생성"""
    img_array = np.zeros((size[0], size[1], 3), dtype=np.uint8)
    segment_width = size[1] // len(colors)
    for i, color in enumerate(colors):
        start = i * segment_width
        end = (i + 1) * segment_width if i < len(colors) - 1 else size[1]
        img_array[:, start:end] = color
    img = Image.fromarray(img_array, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

def test_extract_colors_returns_primary_and_secondary():
    image_bytes = make_test_image([[255, 0, 0], [0, 0, 255]])
    result = extract_colors(image_bytes, n_colors=2)
    assert "primary" in result
    assert "secondary" in result
    assert len(result["secondary"]) <= 4

def test_extract_colors_primary_has_highest_percentage():
    image_bytes = make_test_image([[255, 0, 0]] * 3 + [[0, 0, 255]])
    result = extract_colors(image_bytes, n_colors=2)
    all_colors = [result["primary"]] + result["secondary"]
    max_pct = max(c["percentage"] for c in all_colors)
    assert result["primary"]["percentage"] == max_pct

def test_rgb_to_hex():
    assert rgb_to_hex([255, 0, 0]) == "#FF0000"
    assert rgb_to_hex([0, 255, 0]) == "#00FF00"
    assert rgb_to_hex([0, 0, 0]) == "#000000"

def test_get_color_name_returns_string():
    name = get_color_name([255, 87, 51])
    assert isinstance(name, str)
    assert len(name) > 0
