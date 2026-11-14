"""
Comprehensive Test Runner and Verification Suite for Food Recognition & Nutrition Tracker.
Tests all 15 scenarios specified in the project requirements:
1. Upload a valid food image.
2. Upload an invalid image.
3. Enter a valid food name.
4. Enter an unknown food name.
5. Upload an image matching the text.
6. Upload an image that does not match the text.
7. Test multiple food predictions (top-5).
8. Test nutrition calculations.
9. Test serving-size changes.
10. Test missing nutritional records.
11. Test cache hits.
12. Test cache misses.
13. Test database connectivity.
14. Test API responses.
15. Test COA memory hierarchy instrumentation.
"""

import sys
import io
import time
import asyncio
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database.db import (
    init_db,
    get_all_foods,
    get_food_by_key,
    get_food_by_id,
    save_analysis_history,
    get_analysis_history,
    delete_history_item,
)
from backend.cache.lru_cache import LRUCache, nutrition_lru_cache
from backend.services.nutrition_calculator import calculate_nutrition
from backend.models.portion_estimator import estimate_portion
from backend.services.text_matching import normalize_text, match_food_inputs
from backend.services.image_processor import process_uploaded_image
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
    MatchFoodRequest,
    NutritionRecalculateRequest,
    get_cached_foods_metadata,
)


class MockUpload:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.file = io.BytesIO(content)


def create_sample_image(color=(210, 120, 50)) -> bytes:
    img = Image.new("RGB", (224, 224), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def run_test(name, fn):
    print(f"Testing [{name}]...", end=" ")
    try:
        t0 = time.perf_counter()
        fn()
        elapsed = (time.perf_counter() - t0) * 1000
        print(f"PASSED ({elapsed:.2f} ms)")
        return True, None
    except Exception as e:
        print(f"FAILED: {e}")
        return False, str(e)


def main():
    print("=" * 70)
    print("RUNNING COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 70)

    # Setup
    init_db()
    clf = FoodClassifier.get_instance()
    clf.load_model()
    foods_meta = get_cached_foods_metadata()

    results = []

    # Scenario 1: Upload a valid food image
    def s1():
        b = create_sample_image()
        tensor, pil_img, fn, prep_ms = process_uploaded_image(b, "valid.jpg")
        assert tensor.shape == (1, 3, 224, 224)
        assert prep_ms > 0
    results.append(run_test("1. Valid Food Image Processing", s1))

    # Scenario 2: Upload an invalid image
    def s2():
        try:
            process_uploaded_image(b"corrupt_non_image_bytes", "bad.jpg")
            assert False, "Should have raised ValueError"
        except ValueError:
            pass
    results.append(run_test("2. Invalid Image Rejection", s2))

    # Scenario 3: Enter a valid food name & synonym
    def s3():
        assert normalize_text("Chicken Biryani") == "chicken biryani"
        assert normalize_text("Plate of Hot Masala Dosa") == "masala dosa"
        top_k = [{"class_key": "chicken_biryani", "confidence": 0.90}]
        res = match_food_inputs("Dum Biryani", "chicken_biryani", top_k, foods_meta)
        assert res["match_status"] == "MATCH"
    results.append(run_test("3. Valid Food Name & Synonym Matching", s3))

    # Scenario 4: Enter an unknown food name
    def s4():
        top_k = [{"class_key": "pizza", "confidence": 0.85}]
        res = match_food_inputs("Sushi Roll", "pizza", top_k, foods_meta)
        assert res["match_status"] == "MISMATCH"
        assert res["requires_confirmation"] is True
    results.append(run_test("4. Unknown / Mismatch Food Detection", s4))

    # Scenario 5: Upload an image matching the text
    def s5():
        top_k = [{"class_key": "dosa", "confidence": 0.88}]
        res = match_food_inputs("Masala Dosa", "dosa", top_k, foods_meta)
        assert res["match_status"] == "MATCH"
        assert res["requires_confirmation"] is False
    results.append(run_test("5. Image-Text Match Confirmation", s5))

    # Scenario 6: Upload an image that does not match the text (Prompt Biryani vs Fried Rice example)
    def s6():
        top_k = [{"class_key": "chicken_biryani", "confidence": 0.87}]
        res = match_food_inputs("Veg Fried Rice", "chicken_biryani", top_k, foods_meta)
        assert res["match_status"] == "MISMATCH"
        assert res["requires_confirmation"] is True
        assert "Discrepancy" in res["message"]
    results.append(run_test("6. Prompt Spec: Biryani vs Fried Rice Mismatch Warning", s6))

    # Scenario 7: Test multiple food predictions (Top-5)
    def s7():
        b = create_sample_image()
        tensor, _, _, _ = process_uploaded_image(b, "top5.jpg")
        preds = clf.predict(tensor, top_k=5)
        assert len(preds["top_k_predictions"]) == 5
        assert preds["top_confidence"] > 0
        total_prob = sum(p["confidence"] for p in preds["top_k_predictions"])
        assert 0.0 < total_prob <= 1.01
    results.append(run_test("7. Top-5 Predictions with Confidence", s7))

    # Scenario 8: Test nutrition calculations (Exact proportional formula)
    def s8():
        # Test 180 kcal, 6g protein per 100g -> 200g
        per_100 = {"calories_kcal": 180.0, "protein_g": 6.0, "carbs_g": 25.0, "fat_g": 5.0, "fiber_g": 2.0}
        calc = calculate_nutrition(per_100, 200.0)
        assert calc["total_calories_kcal"] == 360.0
        assert calc["protein_g"] == 12.0
        assert calc["carbohydrates_g"] == 50.0
        assert calc["fat_g"] == 10.0
    results.append(run_test("8. Nutrition Calculation Exact Proportions", s8))

    # Scenario 9: Test serving size changes
    def s9():
        per_100 = {"calories_kcal": 180.0, "protein_g": 6.0, "carbs_g": 25.0, "fat_g": 5.0}
        c1 = calculate_nutrition(per_100, 100.0)
        c2 = calculate_nutrition(per_100, 350.0)
        assert c2["total_calories_kcal"] == 630.0
        assert c2["protein_g"] == 21.0
    results.append(run_test("9. Serving Size Scaling Recalculation", s9))

    # Scenario 10: Test missing nutritional records
    def s10():
        rec, _ = get_food_by_key("totally_unknown_alien_food_xyz")
        assert rec is None
    results.append(run_test("10. Missing Nutrition Database Fallback", s10))

    # Scenario 11 & 12: Test Cache Miss, Hit, Insertion, and Eviction
    def s11_12():
        test_cache = LRUCache(capacity=2)
        # Miss
        v, hit, _ = test_cache.get("dish_a")
        assert hit is False and v is None
        # Put
        test_cache.put("dish_a", {"cals": 200})
        # Hit
        v, hit, _ = test_cache.get("dish_a")
        assert hit is True and v["cals"] == 200
        # Eviction
        test_cache.put("dish_b", {"cals": 300})
        test_cache.put("dish_c", {"cals": 400})  # Should evict dish_a
        v, hit, _ = test_cache.get("dish_a")
        assert hit is False
        assert test_cache.evictions == 1
    results.append(run_test("11 & 12. LRU Cache Hit, Miss, Insert, and Eviction", s11_12))

    # Scenario 13: Test Database Connectivity and Schema
    def s13():
        foods = get_all_foods()
        assert len(foods) >= 12
        b_food, ms = get_food_by_key("chicken_biryani")
        assert b_food is not None
        assert b_food["nutrition_per_100g"]["calories_kcal"] > 0
        assert "IFCT 2017" in b_food["nutrition_per_100g"]["source"]
    results.append(run_test("13. SQLite Database Connectivity & IFCT/USDA Records", s13))

    # Scenario 14: Test End-to-End Analysis Pipeline
    def s14():
        b = create_sample_image()
        upload = MockUpload("biryani.jpg", b)
        res = analyze_food(image=upload, food_name="Chicken Biryani")
        assert res["food_info"]["key"] is not None
        assert res["nutrition"]["total_calories_kcal"] > 0
        assert res["coa_performance"]["total_pipeline_ms"] > 0
    results.append(run_test("14. End-to-End Analysis Pipeline", s14))

    # Scenario 15: Test COA Memory Hierarchy Telemetry
    def s15():
        stats = get_coa_statistics()
        assert stats["model_memory"]["is_resident_in_ram"] is True
        assert stats["model_memory"]["ram_size_mb"] > 0
        assert stats["lru_cache"]["capacity"] > 0
        assert len(stats["memory_hierarchy_table"]) == 4
    results.append(run_test("15. COA Memory Hierarchy Instrumentation", s15))

    passed_count = sum(1 for p, _ in results if p)
    total_count = len(results)

    print("\n" + "=" * 70)
    print(f"VERIFICATION SUMMARY: {passed_count}/{total_count} SCENARIOS PASSED")
    print("=" * 70)

    if passed_count == total_count:
        print("ALL SCENARIOS VALIDATED AND VERIFIED SUCCESSFULLY!")
    else:
        print("Some scenarios failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
