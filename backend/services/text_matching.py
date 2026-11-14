"""
Intelligent Text and Image Matching Service.
Combines user-entered food names and computer vision model predictions using:
- Text normalization and tokenization
- Synonym mapping against verified database
- Token set containment & Jaccard similarity
- Levenshtein edit distance for spelling robustness
- Confidence-weighted decision logic
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from difflib import SequenceMatcher

STOP_WORDS = {
    "a", "an", "the", "plate", "plate of", "bowl", "bowl of", "dish", "dish of",
    "hot", "fresh", "spicy", "homemade", "cooked", "tasty", "delicious", "serving",
    "of", "with", "and", "&"
}


def normalize_text(text: Optional[str]) -> str:
    """Normalizes food text: lowercased, punctuation stripped, stop words removed."""
    if not text:
        return ""
    # Lowercase and replace hyphens/underscores with spaces
    cleaned = text.lower().replace("-", " ").replace("_", " ")
    # Remove non-alphanumeric except space
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    tokens = cleaned.split()
    filtered_tokens = [t for t in tokens if t not in STOP_WORDS]
    return " ".join(filtered_tokens) if filtered_tokens else cleaned.strip()


def compute_string_similarity(s1: str, s2: str) -> float:
    """Computes combined token-set and sequence matcher similarity [0.0, 1.0]."""
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0

    tokens1 = set(s1.split())
    tokens2 = set(s2.split())

    # Token overlap (Jaccard similarity)
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    jaccard = len(intersection) / len(union) if union else 0.0

    # Token containment: if one is subset of the other (e.g. "biryani" in "chicken biryani")
    is_subset = tokens1.issubset(tokens2) or tokens2.issubset(tokens1)

    # Sequence matcher (edit-distance ratio)
    seq_ratio = SequenceMatcher(None, s1, s2).ratio()

    if is_subset and len(intersection) >= 1:
        return max(0.85, seq_ratio)

    # Weighted blend of token similarity and character sequence ratio
    return 0.5 * jaccard + 0.5 * seq_ratio


def match_food_inputs(
    user_input_text: Optional[str],
    predicted_class_key: str,
    top_k_predictions: List[Dict[str, Any]],
    foods_metadata: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Intelligently compares user text with ML image predictions.
    Returns:
    - match_status: 'MATCH' | 'MISMATCH' | 'ALTERNATIVE_MATCH' | 'IMAGE_ONLY' | 'LOW_CONFIDENCE'
    - message: Clear user-facing status description
    - matched_food_key: Selected food key to look up nutrition for
    - requires_confirmation: Boolean indicating whether UI should prompt user
    - match_score: Numerical similarity score [0.0 to 1.0]
    """
    if not user_input_text or not user_input_text.strip():
        top_food = foods_metadata.get(predicted_class_key, {})
        return {
            "match_status": "IMAGE_ONLY",
            "message": f"Recognized from image: {top_food.get('display_name', predicted_class_key)}.",
            "matched_food_key": predicted_class_key,
            "requires_confirmation": False,
            "match_score": 1.0,
            "user_text": "",
            "suggested_actions": ["ACCEPT_IMAGE_PREDICTION"],
        }

    norm_user = normalize_text(user_input_text)
    top_pred_conf = top_k_predictions[0]["confidence"] if top_k_predictions else 0.0

    # Check top-1 match score
    def check_food_match(candidate_key: str) -> float:
        food_info = foods_metadata.get(candidate_key, {})
        display = normalize_text(food_info.get("display_name", ""))
        key_norm = normalize_text(candidate_key)
        synonyms = [normalize_text(s) for s in food_info.get("synonyms", [])]

        scores = [
            compute_string_similarity(norm_user, display),
            compute_string_similarity(norm_user, key_norm),
        ]
        for syn in synonyms:
            scores.append(compute_string_similarity(norm_user, syn))
        return max(scores) if scores else 0.0

    top1_similarity = check_food_match(predicted_class_key)
    top1_display = foods_metadata.get(predicted_class_key, {}).get("display_name", predicted_class_key)

    # Threshold for match
    if top1_similarity >= 0.70:
        return {
            "match_status": "MATCH",
            "message": f"Confirmed Match! User entry '{user_input_text}' matches image prediction '{top1_display}' ({round(top_pred_conf * 100, 1)}% confidence).",
            "matched_food_key": predicted_class_key,
            "requires_confirmation": False,
            "match_score": round(top1_similarity, 3),
            "user_text": user_input_text,
            "suggested_actions": ["PROCEED_WITH_NUTRITION"],
        }

    # If Top-1 didn't match, check if user text matches any of Top-2 to Top-5
    for alt_pred in top_k_predictions[1:]:
        alt_key = alt_pred["class_key"]
        alt_score = check_food_match(alt_key)
        if alt_score >= 0.70:
            alt_display = foods_metadata.get(alt_key, {}).get("display_name", alt_key)
            return {
                "match_status": "ALTERNATIVE_MATCH",
                "message": (
                    f"Secondary Match: User entered '{user_input_text}', which matches alternate model prediction "
                    f"'{alt_display}' ({round(alt_pred['confidence'] * 100, 1)}% confidence) rather than top prediction '{top1_display}'."
                ),
                "matched_food_key": alt_key,
                "requires_confirmation": True,
                "match_score": round(alt_score, 3),
                "user_text": user_input_text,
                "suggested_actions": ["CONFIRM_ALTERNATIVE", "KEEP_TOP_PREDICTION"],
            }

    # If no match across top-5: MISMATCH DETECTED
    # Also check if user entered an known food from entire database
    database_matched_key = None
    database_highest_score = 0.0
    for food_key in foods_metadata.keys():
        sc = check_food_match(food_key)
        if sc > database_highest_score:
            database_highest_score = sc
            database_matched_key = food_key

    resolved_user_food = foods_metadata.get(database_matched_key, {}).get("display_name") if database_highest_score >= 0.65 else user_input_text

    return {
        "match_status": "MISMATCH",
        "message": (
            f"⚠️ Discrepancy Detected: User entered '{user_input_text}', but image classifier predicted "
            f"'{top1_display}' with {round(top_pred_conf * 100, 1)}% confidence. Please confirm which food is on your plate."
        ),
        "matched_food_key": predicted_class_key,
        "user_recognized_key": database_matched_key if database_highest_score >= 0.65 else None,
        "user_recognized_name": resolved_user_food,
        "requires_confirmation": True,
        "match_score": round(top1_similarity, 3),
        "user_text": user_input_text,
        "suggested_actions": ["CHOOSE_IMAGE_PREDICTION", "CHOOSE_USER_TEXT", "MANUAL_CORRECTION"],
    }
