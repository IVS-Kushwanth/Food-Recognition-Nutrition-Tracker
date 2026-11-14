"""
Food Image Classifier Model Service.
Loads trained MobileNetV3-Small weights into RAM once on startup
to prevent expensive repeated disk/SSD I/O on every inference request (COA RAM principle).
Provides top-k predictions, softmax probabilities, unknown food handling, and CPU timing.
"""

import time
from pathlib import Path
from typing import Dict, Any, List, Tuple
import torch
import torch.nn as nn
from torchvision import models

from backend.config import WEIGHTS_PATH, CONFIDENCE_THRESHOLD_UNKNOWN


class FoodClassifier:
    _instance = None

    def __init__(self):
        self.device = torch.device("cpu")
        self.model: Optional[nn.Module] = None
        self.classes: List[str] = []
        self.is_loaded = False
        self.ram_resident_size_mb = 0.0
        self.load_time_ms = 0.0

    @classmethod
    def get_instance(cls) -> "FoodClassifier":
        if cls._instance is None:
            cls._instance = FoodClassifier()
        return cls._instance

    def load_model(self):
        """Loads trained weights from disk into RAM (executed once at startup)."""
        if self.is_loaded:
            return

        t0 = time.perf_counter()
        if not WEIGHTS_PATH.exists():
            raise FileNotFoundError(
                f"Model weights not found at {WEIGHTS_PATH}. Please run training/train.py first."
            )

        checkpoint = torch.load(WEIGHTS_PATH, map_location=self.device)
        self.classes = checkpoint["classes"]
        num_classes = len(self.classes)

        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[0].in_features
        model.classifier = nn.Sequential(
            nn.Linear(in_features, 1024),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(1024, num_classes),
        )

        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(self.device)
        model.eval()

        self.model = model
        self.is_loaded = True

        # Calculate exact parameter memory residency in RAM
        total_param_bytes = sum(p.numel() * p.element_size() for p in self.model.parameters())
        total_buffer_bytes = sum(b.numel() * b.element_size() for b in self.model.buffers())
        self.ram_resident_size_mb = round((total_param_bytes + total_buffer_bytes) / (1024 * 1024), 2)

        t1 = time.perf_counter()
        self.load_time_ms = round((t1 - t0) * 1000.0, 2)
        print(f"[COA RAM] Model loaded into RAM: {self.ram_resident_size_mb} MB in {self.load_time_ms} ms.")

    def predict(self, input_tensor: torch.Tensor, top_k: int = 5) -> Dict[str, Any]:
        """
        Executes forward inference on preprocessed image tensor (1, 3, 224, 224).
        Returns top-k predictions, probabilities, unknown status, and inference time.
        """
        if not self.is_loaded or self.model is None:
            self.load_model()

        input_tensor = input_tensor.to(self.device)

        # Precise CPU inference measurement
        t0 = time.perf_counter()
        with torch.no_grad():
            logits = self.model(input_tensor)
            probabilities = torch.softmax(logits, dim=1)[0]
        t1 = time.perf_counter()
        inference_time_ms = (t1 - t0) * 1000.0

        # Extract top-k
        k = min(top_k, len(self.classes))
        top_probs, top_indices = torch.topk(probabilities, k=k)

        predictions = []
        for prob, idx in zip(top_probs, top_indices):
            class_key = self.classes[idx.item()]
            confidence = float(prob.item())
            predictions.append({
                "class_key": class_key,
                "confidence": round(confidence, 4),
                "confidence_percent": round(confidence * 100.0, 2),
            })

        top1 = predictions[0]
        is_unknown = top1["confidence"] < CONFIDENCE_THRESHOLD_UNKNOWN

        return {
            "top_prediction": top1["class_key"],
            "top_confidence": top1["confidence"],
            "top_confidence_percent": top1["confidence_percent"],
            "top_k_predictions": predictions,
            "inference_time_ms": round(inference_time_ms, 2),
            "is_unknown_food": is_unknown,
            "unknown_warning": (
                "Warning: The model confidence is unusually low (<20%). The image may not contain "
                "one of the supported foods or may be blurry/unrecognized. Please confirm or enter the food manually."
                if is_unknown else None
            ),
        }
