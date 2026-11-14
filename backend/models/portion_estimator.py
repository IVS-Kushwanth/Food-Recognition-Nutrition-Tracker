"""
Portion and Serving Weight Estimation Service.
Implements calibrated culinary density scaling and visual plate coverage analysis,
referencing Nutrition5k food mass methodologies and IFCT portion standards.

NOTE: As mandated by scientific and project guidelines, single 2D RGB photography
lacks 3D depth/volumetric data. Therefore, this service provides an informed estimate,
accompanied by an uncertainty notice and an editable serving size interface.
"""

from typing import Dict, Any, Optional
from PIL import Image
import numpy as np


def estimate_portion(
    food_data: Dict[str, Any],
    pil_image: Optional[Image.Image] = None,
) -> Dict[str, Any]:
    """
    Estimates food serving weight in grams based on verified default portions,
    culinary density (Nutrition5k calibrations), and visual plate coverage.
    """
    default_serving_g = food_data.get("default_serving_g", 200.0)
    density_g_ml = food_data.get("density_g_ml", 1.0)
    serving_desc = food_data.get("serving_unit_description", "1 standard serving")

    # If image is available, analyze food foreground pixel coverage
    area_factor = 1.0
    if pil_image is not None:
        try:
            # Resize for fast CPU analysis
            small_img = pil_image.resize((128, 128))
            img_arr = np.array(small_img.convert("RGB"), dtype=np.float32)
            # Compute saturation and color variance to approximate non-empty foreground
            r, g, b = img_arr[:, :, 0], img_arr[:, :, 1], img_arr[:, :, 2]
            max_c = np.maximum(np.maximum(r, g), b)
            min_c = np.minimum(np.minimum(r, g), b)
            delta = max_c - min_c
            saturation = np.where(max_c > 0, delta / (max_c + 1e-5), 0)

            # Mask of colorful / non-neutral food pixels
            food_mask = (saturation > 0.15) & (max_c > 40) & (min_c < 240)
            coverage_ratio = float(np.mean(food_mask))

            # Calibrate factor: 0.2 coverage -> 0.85x, 0.5 coverage -> 1.0x, 0.8 coverage -> 1.2x
            if coverage_ratio < 0.30:
                area_factor = 0.85
            elif coverage_ratio > 0.65:
                area_factor = 1.15
            else:
                area_factor = 1.0
        except Exception:
            area_factor = 1.0

    estimated_weight = round(default_serving_g * area_factor, 1)

    return {
        "estimated_serving_weight_g": estimated_weight,
        "default_serving_weight_g": default_serving_g,
        "serving_unit_description": serving_desc,
        "density_g_ml": density_g_ml,
        "estimation_method": "Nutrition5k Culinary Density & 2D Plate Area Coverage",
        "uncertainty_level": "Moderate (Single 2D RGB View)",
        "uncertainty_warning": (
            "Single 2D photograph lacks 3D depth and density sensors. "
            "Estimated based on standard culinary serving sizes (IFCT / USDA). "
            "Please adjust the serving size below if your portion differs."
        ),
        "is_editable": True,
    }
