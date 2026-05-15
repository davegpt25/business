import cv2
import numpy as np
from sklearn.cluster import KMeans
from PIL import Image
import io
from typing import Dict, List

COLOR_NAMES = {
    "red": ([150, 0, 0], [255, 80, 80]),
    "orange": ([200, 100, 0], [255, 180, 80]),
    "yellow": ([200, 200, 0], [255, 255, 100]),
    "green": ([0, 100, 0], [100, 200, 100]),
    "blue": ([0, 0, 100], [80, 130, 255]),
    "navy": ([0, 0, 50], [50, 70, 130]),
    "purple": ([80, 0, 80], [180, 80, 200]),
    "pink": ([200, 100, 120], [255, 200, 220]),
    "white": ([200, 200, 200], [255, 255, 255]),
    "gray": ([80, 80, 80], [180, 180, 180]),
    "black": ([0, 0, 0], [60, 60, 60]),
    "brown": ([80, 40, 10], [160, 110, 70]),
    "beige": ([180, 160, 120], [230, 215, 180]),
}

def get_color_name(rgb: List[int]) -> str:
    min_dist = float("inf")
    closest = "neutral"
    for name, (low, high) in COLOR_NAMES.items():
        center = [(low[i] + high[i]) / 2 for i in range(3)]
        dist = sum((rgb[i] - center[i]) ** 2 for i in range(3)) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest = name
    return closest

def rgb_to_hex(rgb: List[int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def extract_colors(image_bytes: bytes, n_colors: int = 5) -> Dict:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        # Pillow fallback
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pixels = img_rgb.reshape(-1, 3).astype(np.float32)

    # Remove near-white pixels (background removal assist)
    mask = ~(
        (pixels[:, 0] > 240) & (pixels[:, 1] > 240) & (pixels[:, 2] > 240)
    )
    pixels = pixels[mask]
    if len(pixels) < n_colors:
        pixels = img_rgb.reshape(-1, 3).astype(np.float32)

    kmeans = KMeans(n_clusters=min(n_colors, len(pixels)), random_state=42, n_init=10)
    kmeans.fit(pixels)

    centers = kmeans.cluster_centers_
    labels = kmeans.labels_
    counts = np.bincount(labels)
    total = counts.sum()

    color_data = []
    for i, center in enumerate(centers):
        rgb = [int(c) for c in center]
        color_data.append({
            "hex": rgb_to_hex(rgb),
            "rgb": rgb,
            "percentage": round(counts[i] / total, 4),
            "name": get_color_name(rgb),
        })

    color_data.sort(key=lambda x: x["percentage"], reverse=True)
    primary = color_data[0]
    secondary = color_data[1:]

    return {
        "primary": primary,
        "secondary": secondary,
        "dominant_palette": [c["hex"] for c in color_data],
    }
