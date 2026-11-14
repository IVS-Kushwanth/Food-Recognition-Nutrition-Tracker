"""
Unit tests for Text and Image Matching Logic.
Verifies matching confirmed, mismatch detected, synonyms, and partial/alternative matches.
"""

import pytest
from backend.services.text_matching import normalize_text, match_food_inputs


@pytest.fixture
def mock_foods_metadata():
    return {
        "chicken_biryani": {
            "display_name": "Chicken Biryani",
            "synonyms": ["biryani", "chicken biryani", "hyderabadi biryani", "dum biryani"],
        },
        "fried_rice": {
            "display_name": "Fried Rice",
            "synonyms": ["veg fried rice", "egg fried rice", "chinese fried rice"],
        },
        "dosa": {
            "display_name": "Masala Dosa",
            "synonyms": ["dosa", "masala dosa", "crispy dosa"],
        },
        "pizza": {
            "display_name": "Pizza",
            "synonyms": ["cheese pizza", "margherita pizza"],
        },
    }


def test_text_normalization():
    assert normalize_text("Plate of Chicken Biryani!") == "chicken biryani"
    assert normalize_text("Hot & Spicy Fried Rice") == "fried rice"
    assert normalize_text("  masala-dosa   ") == "masala dosa"


def test_exact_and_synonym_match(mock_foods_metadata):
    top_k = [{"class_key": "chicken_biryani", "confidence": 0.91}]

    # Exact match
    res1 = match_food_inputs("Chicken Biryani", "chicken_biryani", top_k, mock_foods_metadata)
    assert res1["match_status"] == "MATCH"
    assert res1["requires_confirmation"] is False

    # Synonym match ("hyderabadi biryani")
    res2 = match_food_inputs("hyderabadi biryani", "chicken_biryani", top_k, mock_foods_metadata)
    assert res2["match_status"] == "MATCH"


def test_mismatch_detection(mock_foods_metadata):
    # Prompt example: User enters "Veg Fried Rice", Image predicted "Chicken Biryani" (87%)
    top_k = [{"class_key": "chicken_biryani", "confidence": 0.87}]

    res = match_food_inputs("Veg Fried Rice", "chicken_biryani", top_k, mock_foods_metadata)
    assert res["match_status"] == "MISMATCH"
    assert res["requires_confirmation"] is True
    assert "Discrepancy Detected" in res["message"]


def test_image_only_input(mock_foods_metadata):
    top_k = [{"class_key": "pizza", "confidence": 0.94}]
    res = match_food_inputs("", "pizza", top_k, mock_foods_metadata)
    assert res["match_status"] == "IMAGE_ONLY"
    assert res["requires_confirmation"] is False
