"""
Image Preprocessing Service.
Validates uploaded food images in RAM (avoiding redundant disk I/O bottlenecks),
applies standardized ImageNet transformations, measures CPU preprocessing time,
and saves the image to uploads directory for frontend visualization and history.
"""

import io
import time
import uuid
from pathlib import Path
from typing import Tuple
from PIL import Image
import torch
from torchvision import transforms

from backend.config import (
    UPLOAD_DIR,
    MAX_IMAGE_SIZE_BYTES,
    IMAGE_INPUT_SIZE,
)

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Standard deterministic evaluation transform
preprocess_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMAGE_INPUT_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def process_uploaded_image(
    file_bytes: bytes, filename: str
) -> Tuple[torch.Tensor, Image.Image, str, float]:
    """
    Validates, in-memory decodes, stores, and preprocesses an image file.
    Returns:
    (preprocessed_tensor_1_3_224_224, pil_image, saved_filename, preprocess_time_ms)
    """
    t0 = time.perf_counter()

    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(f"File size exceeds maximum limit of {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB.")

    if len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty.")

    # Decode in RAM using BytesIO
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            pil_image = img.convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image format: {e}")

    # Generate unique filename and save to secondary storage
    ext = Path(filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"
    unique_filename = f"{uuid.uuid4().hex[:12]}_{int(time.time())}{ext}"
    saved_path = UPLOAD_DIR / unique_filename

    try:
        pil_image.save(saved_path, format="JPEG", quality=90)
    except Exception as e:
        print(f"Warning: could not write upload to disk: {e}")

    # Transform tensor: (3, 224, 224) -> (1, 3, 224, 224)
    tensor = preprocess_transform(pil_image)
    tensor_batch = tensor.unsqueeze(0)

    t1 = time.perf_counter()
    preprocess_time_ms = (t1 - t0) * 1000.0

    return tensor_batch, pil_image, unique_filename, preprocess_time_ms
