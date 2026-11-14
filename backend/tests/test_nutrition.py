"""
Unit tests for Nutrition Database and Scaling Calculations.
Verifies proportional calculation, serving size modifications,
and database record integrity against IFCT / USDA standards.
"""

import pytest
from backend.database.db import init_db, get_food_by_key, get_all_foods
from backend.services.nutrition_calculator import calculate_nutrition
from backend.models.portion_estimator import estimate_portion


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_database_seeded_correctly():
    foods = get_all_foods()
    assert len(foods) >= 12
    keys = [f["key"] for f in foods]
    assert "chicken_biryani" in keys
    assert "dosa" in keys
    assert "idli" in keys
    assert "pizza" in keys


def test_nutrition_calculation_exact_proportions():
    # Test per 100g sample from prompt specification:
    # 180 kcal, 6g protein, 25g carbs, 5g fat -> 200g serving
    sample_100g = {
        "calories_kcal": 180.0,
        "protein_g": 6.0,
        "carbs_g": 25.0,
        "fat_g": 5.0,
        "fiber_g": 2.0,
        "sugar_g": 1.0,
        "sodium_mg": 300.0,
        "source": "Test Spec",
    }
    calc_200g = calculate_nutrition(sample_100g, 200.0)

    assert calc_200g["total_calories_kcal"] == 360.0
    assert calc_200g["protein_g"] == 12.0
    assert calc_200g["carbohydrates_g"] == 50.0
    assert calc_200g["fat_g"] == 10.0
    assert calc_200g["fiber_g"] == 4.0

    # Test 350g serving
    calc_350g = calculate_nutrition(sample_100g, 350.0)
    assert calc_350g["total_calories_kcal"] == 630.0
    assert calc_350g["protein_g"] == 21.0


def test_missing_food_handling():
    food, lookup_ms = get_food_by_key("non_existent_dish_xyz")
    assert food is None
    assert lookup_ms >= 0.0


def test_portion_estimator():
    food_data = {
        "key": "chicken_biryani",
        "default_serving_g": 350.0,
        "density_g_ml": 0.85,
        "serving_unit_description": "1 plate (~350g)",
    }
    portion = estimate_portion(food_data)
    assert portion["estimated_serving_weight_g"] > 0
    assert portion["is_editable"] is True
    assert "uncertainty_warning" in portion
