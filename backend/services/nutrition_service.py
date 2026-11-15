"""
Nutrition Retrieval and Caching Service for COA Integration.
Coordinates between Application LRU Cache (fast microsecond memory lookup)
and Secondary Storage (SQLite Disk I/O).
"""

import time
from typing import Dict, Any, Optional, Tuple

from backend.cache.lru_cache import nutrition_lru_cache
from backend.database.db import get_food_by_key, get_food_by_id, get_all_foods
from backend.services.nutrition_calculator import calculate_nutrition


def get_food_record(food_key: str) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Looks up food record via LRU Cache first; falls back to SQLite disk lookup on miss.
    Instruments exact timing to demonstrate COA memory hierarchy latency differences.
    """
    # 1. Check Application LRU Cache (In-Memory Doubly Linked List)
    cached_val, is_hit, cache_lookup_us = nutrition_lru_cache.get(food_key)

    if is_hit and cached_val is not None:
        return cached_val, {
            "cache_status": "HIT",
            "cache_lookup_us": round(cache_lookup_us, 2),
            "db_lookup_ms": 0.0,
            "tier_accessed": "Application LRU Cache (RAM)",
            "speedup_factor": "Direct memory reference (O(1))",
        }

    # 2. Cache Miss: Fall back to Secondary Storage (SQLite Disk Query)
    db_record, db_lookup_ms = get_food_by_key(food_key)

    if db_record is not None:
        # Insert into LRU Cache for subsequent queries
        put_event = nutrition_lru_cache.put(food_key, db_record)
        return db_record, {
            "cache_status": "MISS",
            "cache_lookup_us": round(cache_lookup_us, 2),
            "db_lookup_ms": round(db_lookup_ms, 2),
            "tier_accessed": "Secondary Storage (SQLite Database)",
            "evicted_key": put_event.get("evicted_key"),
            "action": "Inserted into LRU Cache",
        }

    return None, {
        "cache_status": "MISS_NOT_FOUND",
        "cache_lookup_us": round(cache_lookup_us, 2),
        "db_lookup_ms": round(db_lookup_ms, 2),
        "tier_accessed": "Secondary Storage (Not Found)",
    }


def get_and_calculate_nutrition(
    food_key: str, serving_weight_g: Optional[float] = None
) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Retrieves food details and computes scaled nutrition based on serving weight.
    """
    food_data, coa_metrics = get_food_record(food_key)
    if not food_data:
        return None, coa_metrics

    serving_g = serving_weight_g if (serving_weight_g and serving_weight_g > 0) else food_data["default_serving_g"]
    calc_nutrition = calculate_nutrition(food_data["nutrition_per_100g"], serving_g)

    result = {
        "food_info": {
            "id": food_data["id"],
            "key": food_data["key"],
            "display_name": food_data["display_name"],
            "category": food_data["category"],
            "cuisine": food_data["cuisine"],
            "default_serving_g": food_data["default_serving_g"],
            "serving_unit_description": food_data["serving_unit_description"],
            "description": food_data["description"],
            "nutrition_per_100g": food_data["nutrition_per_100g"],
        },
        "calculated_nutrition": calc_nutrition,
        "coa_metrics": coa_metrics,
    }
    return result, coa_metrics
