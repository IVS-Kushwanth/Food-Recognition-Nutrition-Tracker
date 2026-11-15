"""
Nutrition Calculation Service.
Calculates proportional nutritional breakdowns strictly adhering to the standard formula:
  Nutrient Amount = (Nutrient per 100g * Serving weight in grams) / 100.0

Includes macronutrient energy distribution (% of calories from protein, carbs, fat)
and reference daily values (% DV) for balanced dietary tracking.
"""

from typing import Dict, Any


def calculate_nutrition(
    nutrition_per_100g: Dict[str, Any],
    serving_weight_g: float,
) -> Dict[str, Any]:
    """
    Computes scaled nutritional values based on serving weight in grams.
    """
    if serving_weight_g <= 0:
        serving_weight_g = 100.0

    factor = serving_weight_g / 100.0

    calories = round(nutrition_per_100g["calories_kcal"] * factor, 1)
    protein = round(nutrition_per_100g["protein_g"] * factor, 1)
    carbs = round(nutrition_per_100g["carbs_g"] * factor, 1)
    fat = round(nutrition_per_100g["fat_g"] * factor, 1)
    fiber = round(nutrition_per_100g.get("fiber_g", 0.0) * factor, 1)
    sugar = round(nutrition_per_100g.get("sugar_g", 0.0) * factor, 1)
    sodium = round(nutrition_per_100g.get("sodium_mg", 0.0) * factor, 1)

    # Energy contribution from macronutrients (Atwater factors: 4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
    protein_cals = protein * 4.0
    carbs_cals = carbs * 4.0
    fat_cals = fat * 9.0
    total_macro_cals = max(protein_cals + carbs_cals + fat_cals, 0.1)

    pct_protein = round((protein_cals / total_macro_cals) * 100.0, 1)
    pct_carbs = round((carbs_cals / total_macro_cals) * 100.0, 1)
    pct_fat = round((fat_cals / total_macro_cals) * 100.0, 1)

    # FDA 2,000 kcal standard daily value percentages
    dv_calories = round((calories / 2000.0) * 100.0, 1)
    dv_protein = round((protein / 50.0) * 100.0, 1)
    dv_carbs = round((carbs / 275.0) * 100.0, 1)
    dv_fat = round((fat / 78.0) * 100.0, 1)
    dv_fiber = round((fiber / 28.0) * 100.0, 1)
    dv_sodium = round((sodium / 2300.0) * 100.0, 1)

    nutrients_dict = {
        "calories_kcal": calories,
        "protein_g": protein,
        "carbohydrates_g": carbs,
        "fat_g": fat,
        "fiber_g": fiber,
        "sugar_g": sugar,
        "sodium_mg": sodium,
    }

    return {
        "serving_weight_g": round(serving_weight_g, 1),
        "total_calories_kcal": calories,
        "calories_kcal": calories,
        "protein_g": protein,
        "carbohydrates_g": carbs,
        "fat_g": fat,
        "fiber_g": fiber,
        "sugar_g": sugar,
        "sodium_mg": sodium,
        "source": nutrition_per_100g.get("source", "Verified Nutritional Database"),
        "per_100g": nutrition_per_100g,
        "nutrients": nutrients_dict,
        "macronutrient_distribution": [
            {"name": "Protein", "grams": protein, "calories": round(protein_cals, 1), "percentage": pct_protein, "color": "#10B981"},
            {"name": "Carbohydrates", "grams": carbs, "calories": round(carbs_cals, 1), "percentage": pct_carbs, "color": "#3B82F6"},
            {"name": "Fat", "grams": fat, "calories": round(fat_cals, 1), "percentage": pct_fat, "color": "#F59E0B"},
        ],
        "energy_breakdown_percent": {
            "protein_percent": pct_protein,
            "carbohydrates_percent": pct_carbs,
            "fat_percent": pct_fat,
        },
        "daily_values_percent": {
            "calories": dv_calories,
            "protein": dv_protein,
            "carbohydrates": dv_carbs,
            "fat": dv_fat,
            "fiber": dv_fiber,
            "sodium": dv_sodium,
        },
        "daily_value_percentages": {
            "calories": dv_calories,
            "protein": dv_protein,
            "carbohydrates": dv_carbs,
            "fat": dv_fat,
            "fiber": dv_fiber,
            "sodium": dv_sodium,
        },
    }
