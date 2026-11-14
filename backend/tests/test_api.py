"""
Integration & Functional API Tests for Food Recognition Backend.
Executes direct endpoint testing, verifying contract schemas,
ML pipeline responses, nutrition calculations, and COA statistics.
"""

import io
from pathlib import Path
import pytest
from PIL import Image

from backend.database.db import init_db
from backend.models.food_classifier import FoodClassifier
from backend.api.routes import (
    health_check,
    list_foods,
    get_food_details,
    match_food,
    recalculate_nutrition,
    get_coa_statistics,
    analyze_food,
    recognize_food,
    get_history,
    delete_single_history,
    MatchFoodRequest,
    NutritionRecalculateRequest,
)


@pytest.fixture(scope="module", autouse=True)
def setup_environment():
    init_db()
    classifier = FoodClassifier.get_instance()
    classifier.load_model()


class MockUploadFile:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.file = io.BytesIO(content)


def create_sample_food_image_mock(filename="plate.jpg") -> MockUploadFile:
    img = Image.new("RGB", (224, 224), color=(220, 110, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return MockUploadFile(filename=filename, content=buf.getvalue())


def test_health_check_endpoint():
    res = health_check()
    assert res["status"] == "healthy"
    assert res["model_loaded_in_ram"] is True
    assert res["model_ram_mb"] > 0


def test_list_foods_endpoint():
    res = list_foods()
    assert res["total"] >= 12
    food_names = [f["display_name"] for f in res["foods"]]
    assert "Chicken Biryani" in food_names
    assert "Masala Dosa" in food_names


def test_get_food_details_endpoint():
    res = get_food_details(food_id=1)
    assert "food" in res
    assert res["food"]["id"] == 1
    assert "nutrition_per_100g" in res["food"]
    assert res["lookup_latency_ms"] >= 0.0


def test_recognize_food_endpoint():
    upload = create_sample_food_image_mock("recognize_test.jpg")
    res = recognize_food(image=upload)
    assert "top_prediction" in res
    assert "top_confidence" in res
    assert len(res["top_k_predictions"]) == 5
    assert res["inference_time_ms"] > 0


def test_match_food_matching_case():
    req = MatchFoodRequest(
        user_food_name="Chicken Biryani",
        predicted_food_key="chicken_biryani",
        top_k_predictions=[{"class_key": "chicken_biryani", "confidence": 0.92}],
    )
    res = match_food(req)
    assert res["match_status"] == "MATCH"
    assert res["requires_confirmation"] is False


def test_match_food_mismatch_case():
    req = MatchFoodRequest(
        user_food_name="Veg Fried Rice",
        predicted_food_key="chicken_biryani",
        top_k_predictions=[{"class_key": "chicken_biryani", "confidence": 0.88}],
    )
    res = match_food(req)
    assert res["match_status"] == "MISMATCH"
    assert res["requires_confirmation"] is True
    assert "Discrepancy" in res["message"]


def test_recalculate_nutrition_endpoint():
    req = NutritionRecalculateRequest(
        food_key="chicken_biryani",
        serving_weight_g=250.0,
    )
    res = recalculate_nutrition(req)
    assert res["calculated_nutrition"]["serving_weight_g"] == 250.0
    assert res["calculated_nutrition"]["total_calories_kcal"] > 0
    assert "coa_metrics" in res
    assert res["coa_metrics"]["cache_status"] in ["HIT", "MISS"]


def test_coa_statistics_endpoint():
    res = get_coa_statistics()
    assert "model_memory" in res
    assert res["model_memory"]["is_resident_in_ram"] is True
    assert "lru_cache" in res
    assert "memory_hierarchy_table" in res
    assert len(res["memory_hierarchy_table"]) == 4


def test_end_to_end_analyze_endpoint():
    upload = create_sample_food_image_mock("biryani_plate.jpg")
    res = analyze_food(image=upload, food_name="Chicken Biryani")

    assert "analysis_id" in res
    assert "food_info" in res
    assert "recognition" in res
    assert "matching" in res
    assert "portion_estimation" in res
    assert "nutrition" in res
    assert "coa_performance" in res

    # Verify COA performance tracking
    perf = res["coa_performance"]
    assert perf["preprocessing_time_ms"] > 0
    assert perf["inference_time_ms"] > 0
    assert perf["total_pipeline_ms"] > 0
    assert perf["model_ram_resident_mb"] > 0


def test_history_lifecycle():
    upload = create_sample_food_image_mock("history_test.jpg")
    analyze_food(image=upload, food_name="Masala Dosa")

    history = get_history(limit=10, offset=0)
    assert "records" in history
    assert history["total"] >= 1

    first_id = history["records"][0]["id"]
    del_res = delete_single_history(first_id)
    assert del_res["success"] is True
