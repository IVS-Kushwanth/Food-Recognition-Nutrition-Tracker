"""
Configuration settings for Food Recognition & Nutrition Tracker.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# File paths
WEIGHTS_PATH = BASE_DIR / "backend" / "models" / "saved_weights" / "food_classifier.pt"
CLASS_MAPPING_PATH = BASE_DIR / "datasets" / "class_mapping.json"
DATABASE_PATH = BASE_DIR / "backend" / "database" / "food_nutrition.db"
UPLOAD_DIR = BASE_DIR / "backend" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Image processing constraints
MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
IMAGE_INPUT_SIZE = 224

# Model & Decision thresholds
CONFIDENCE_THRESHOLD_UNKNOWN = 0.20  # Below 20% confidence flag as unknown/uncertain
CONFIDENCE_THRESHOLD_STRONG = 0.50

# LRU Cache settings for COA demonstration
LRU_CACHE_CAPACITY = 6

# Autonomous Agent System Configuration
AGENT_DB_PATH = BASE_DIR / "backend" / "database" / "agent_management.db"
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_COA_DIR = REPORTS_DIR / "coa"
REPORTS_AI_DIR = REPORTS_DIR / "ai_engineer"
REPORTS_BENCHMARK_DIR = REPORTS_DIR / "benchmarks"

for d in [REPORTS_DIR, REPORTS_COA_DIR, REPORTS_AI_DIR, REPORTS_BENCHMARK_DIR]:
    d.mkdir(parents=True, exist_ok=True)

