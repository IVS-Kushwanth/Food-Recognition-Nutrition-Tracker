"""
FastAPI Routes for Food Recognition & Nutrition Tracker.
Modular endpoints for food recognition, text matching, nutrition calculation,
history management, and COA memory hierarchy instrumentation.
"""

import time
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query
from pydantic import BaseModel, Field

from backend.models.food_classifier import FoodClassifier
from backend.models.portion_estimator import estimate_portion
from backend.services.image_processor import process_uploaded_image
from backend.services.text_matching import match_food_inputs
from backend.services.nutrition_service import get_food_record, get_and_calculate_nutrition
from backend.services.nutrition_calculator import calculate_nutrition
from backend.database.db import (
    get_all_foods,
    get_food_by_id,
    get_food_by_key,
    save_analysis_history,
    get_analysis_history,
    delete_history_item,
    clear_all_history,
)
from backend.cache.lru_cache import nutrition_lru_cache

router = APIRouter(prefix="/api")


# Request/Response Pydantic Schemas
class MatchFoodRequest(BaseModel):
    user_food_name: str
    predicted_food_key: str
    top_k_predictions: Optional[List[dict]] = None


class NutritionRecalculateRequest(BaseModel):
    food_key: str
    serving_weight_g: float = Field(..., gt=0, description="Serving weight in grams")


# Cache of food metadata for quick text-matching lookup
_FOODS_CACHE = {}


def get_cached_foods_metadata():
    global _FOODS_CACHE
    if not _FOODS_CACHE:
        foods = get_all_foods()
        for f in foods:
            full_record, _ = get_food_by_key(f["key"])
            if full_record:
                _FOODS_CACHE[f["key"]] = full_record
    return _FOODS_CACHE


@router.get("/health")
def health_check():
    """Health check endpoint confirming RAM model residency and database availability."""
    classifier = FoodClassifier.get_instance()
    return {
        "status": "healthy",
        "model_loaded_in_ram": classifier.is_loaded,
        "model_ram_mb": classifier.ram_resident_size_mb,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/foods")
def list_foods():
    """Returns all supported foods with default serving guidance and culinary metadata."""
    foods = get_all_foods()
    return {"total": len(foods), "foods": foods}


@router.get("/food/{food_id}")
def get_food_details(food_id: int):
    """Retrieves detailed food composition record by ID."""
    food_data, db_ms = get_food_by_id(food_id)
    if not food_data:
        raise HTTPException(status_code=404, detail=f"Food with ID {food_id} not found.")
    return {"food": food_data, "lookup_latency_ms": db_ms}


@router.post("/recognize-food")
def recognize_food(image: UploadFile = File(...)):
    """
    Image recognition endpoint.
    Processes uploaded image and executes forward inference via MobileNetV3-Small in RAM.
    Runs in threadpool to prevent blocking the event loop during CPU inference.
    """
    t_start = time.perf_counter()
    file_bytes = image.file.read()

    try:
        tensor, pil_img, saved_filename, prep_ms = process_uploaded_image(file_bytes, image.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    classifier = FoodClassifier.get_instance()
    preds = classifier.predict(tensor, top_k=5)

    total_ms = (time.perf_counter() - t_start) * 1000.0

    return {
        "image_filename": saved_filename,
        "preprocessing_time_ms": round(prep_ms, 2),
        "inference_time_ms": preds["inference_time_ms"],
        "total_time_ms": round(total_ms, 2),
        "top_prediction": preds["top_prediction"],
        "top_confidence": preds["top_confidence"],
        "top_confidence_percent": preds["top_confidence_percent"],
        "top_k_predictions": preds["top_k_predictions"],
        "is_unknown_food": preds["is_unknown_food"],
        "unknown_warning": preds["unknown_warning"],
    }


@router.post("/match-food")
def match_food(payload: MatchFoodRequest):
    """
    Compares user text with model predictions using semantic token overlap and synonym mapping.
    """
    foods_meta = get_cached_foods_metadata()
    top_k = payload.top_k_predictions or [{"class_key": payload.predicted_food_key, "confidence": 0.85}]

    match_result = match_food_inputs(
        user_input_text=payload.user_food_name,
        predicted_class_key=payload.predicted_food_key,
        top_k_predictions=top_k,
        foods_metadata=foods_meta,
    )
    return match_result


@router.post("/analyze")
def analyze_food(
    image: UploadFile = File(...),
    food_name: Optional[str] = Form(None),
):
    """
    Unified end-to-end analysis pipeline:
    Image Upload -> Preprocessing -> Model Inference (RAM) -> Text Matching ->
    Portion Estimation -> LRU Cache / DB Nutrition Lookup -> History Persistence.
    Runs synchronously in threadpool to prevent blocking the event loop.
    """
    t0_pipeline = time.perf_counter()

    # 1. Process Image
    file_bytes = image.file.read()
    try:
        tensor, pil_img, saved_filename, prep_ms = process_uploaded_image(file_bytes, image.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Model Inference (CPU RAM)
    classifier = FoodClassifier.get_instance()
    pred_results = classifier.predict(tensor, top_k=5)
    predicted_key = pred_results["top_prediction"]

    # 3. Text and Image Matching
    foods_meta = get_cached_foods_metadata()
    match_result = match_food_inputs(
        user_input_text=food_name,
        predicted_class_key=predicted_key,
        top_k_predictions=pred_results["top_k_predictions"],
        foods_metadata=foods_meta,
    )

    # Determine which food to calculate nutrition for:
    # If user entered something that matched an alternative or if user confirmed, use that key
    target_food_key = match_result.get("matched_food_key", predicted_key)
    if match_result["match_status"] == "MISMATCH" and match_result.get("user_recognized_key"):
        # We still look up predicted food nutrition by default, but also provide user food nutrition
        pass

    # 4. Portion Estimation
    food_record, coa_metrics = get_food_record(target_food_key)
    if not food_record:
        # Fallback to top predicted if target was unknown
        target_food_key = predicted_key
        food_record, coa_metrics = get_food_record(target_food_key)

    portion_info = estimate_portion(food_record, pil_image=pil_img)
    serving_weight_g = portion_info["estimated_serving_weight_g"]

    # 5. Nutrition Calculation
    calc_nutrition = calculate_nutrition(food_record["nutrition_per_100g"], serving_weight_g)

    t1_pipeline = time.perf_counter()
    total_pipeline_ms = (t1_pipeline - t0_pipeline) * 1000.0

    # 6. Save to Analysis History
    history_id = save_analysis_history(
        timestamp=datetime.utcnow().isoformat(),
        input_food_name=food_name or "",
        predicted_food_id=food_record["id"],
        predicted_food_name=food_record["display_name"],
        confidence_score=pred_results["top_confidence"],
        match_status=match_result["match_status"],
        serving_weight_g=serving_weight_g,
        calories_kcal=calc_nutrition["total_calories_kcal"],
        protein_g=calc_nutrition["protein_g"],
        carbs_g=calc_nutrition["carbohydrates_g"],
        fat_g=calc_nutrition["fat_g"],
        fiber_g=calc_nutrition["fiber_g"],
        image_filename=saved_filename,
        inference_time_ms=pred_results["inference_time_ms"],
        db_lookup_time_ms=coa_metrics["db_lookup_ms"],
        cache_hit=1 if coa_metrics["cache_status"] == "HIT" else 0,
    )

    # Build formatted structures for seamless frontend consumption
    frontend_preds = [
        {
            "food_key": p["class_key"],
            "food_name": foods_meta.get(p["class_key"], {}).get("display_name", p["class_key"].replace("_", " ").title()),
            "confidence": p["confidence"],
            "confidence_percent": p["confidence_percent"],
        }
        for p in pred_results["top_k_predictions"]
    ]

    is_matched = match_result["match_status"] in ("EXACT_MATCH", "SYNONYM_MATCH", "HIGH_CONFIDENCE_MATCH")
    frontend_match = {
        "is_match": is_matched,
        "match_type": match_result["match_status"],
        "similarity_score": match_result.get("match_score", 0.0),
        "message": match_result["message"],
        "user_input_normalized": match_result.get("user_text", "") or food_name or "",
        "predicted_food_name": food_record["display_name"],
        "predicted_food_key": food_record["key"],
        "user_recognized_key": match_result.get("user_recognized_key"),
        "user_recognized_name": match_result.get("user_recognized_name"),
        "requires_confirmation": match_result.get("requires_confirmation", False),
    }

    frontend_portion = {
        "serving_weight_g": serving_weight_g,
        "estimated_weight_g": portion_info.get("estimated_serving_weight_g", serving_weight_g),
        "density_g_cm3": portion_info.get("density_g_cm3", 0.85),
        "plate_coverage_ratio": portion_info.get("plate_coverage_ratio", 0.5),
        "unit": "grams",
        "uncertainty_note": portion_info.get("uncertainty_note", ""),
    }

    frontend_coa = {
        "image_preprocess_ms": round(prep_ms, 2),
        "model_inference_ms": pred_results["inference_time_ms"],
        "cache_lookup_ms": round(coa_metrics["cache_lookup_us"] / 1000.0, 3),
        "cache_status": coa_metrics["cache_status"],
        "total_processing_ms": round(total_pipeline_ms, 2),
        "model_ram_resident": classifier.is_loaded,
        "model_ram_mb": classifier.ram_resident_size_mb,
        "lru_cache_stats": nutrition_lru_cache.get_stats(),
        "db_lookup_saved": coa_metrics["cache_status"] == "HIT",
    }

    return {
        "analysis_id": history_id,
        "image_filename": saved_filename,
        "food_key": food_record["key"],
        "food_name": food_record["display_name"],
        "top_prediction": {
            "food_key": food_record["key"],
            "food_name": food_record["display_name"],
        },
        "food_info": {
            "id": food_record["id"],
            "key": food_record["key"],
            "display_name": food_record["display_name"],
            "category": food_record["category"],
            "cuisine": food_record["cuisine"],
            "description": food_record["description"],
            "nutrition_per_100g": food_record["nutrition_per_100g"],
        },
        "recognition": {
            "top_prediction": pred_results["top_prediction"],
            "top_prediction_display": food_record["display_name"],
            "top_confidence": pred_results["top_confidence"],
            "top_confidence_percent": pred_results["top_confidence_percent"],
            "top_k_predictions": pred_results["top_k_predictions"],
            "is_unknown_food": pred_results["is_unknown_food"],
            "unknown_warning": pred_results["unknown_warning"],
        },
        "predictions": frontend_preds,
        "match": frontend_match,
        "matching": match_result,
        "portion": frontend_portion,
        "portion_estimation": portion_info,
        "nutrition": calc_nutrition,
        "coa_metrics": frontend_coa,
        "coa_performance": {
            "preprocessing_time_ms": round(prep_ms, 2),
            "inference_time_ms": pred_results["inference_time_ms"],
            "cache_lookup_us": coa_metrics["cache_lookup_us"],
            "db_lookup_ms": coa_metrics["db_lookup_ms"],
            "total_pipeline_ms": round(total_pipeline_ms, 2),
            "cache_status": coa_metrics["cache_status"],
            "tier_accessed": coa_metrics["tier_accessed"],
            "model_ram_resident_mb": classifier.ram_resident_size_mb,
        },
    }


@router.post("/nutrition")
def recalculate_nutrition(payload: NutritionRecalculateRequest):
    """
    Recalculates nutritional breakdown for adjusted serving weight in grams.
    Uses LRU Cache for microsecond retrieval.
    """
    result, coa_metrics = get_and_calculate_nutrition(payload.food_key, payload.serving_weight_g)
    if not result:
        raise HTTPException(status_code=404, detail=f"Food '{payload.food_key}' not found.")
    
    calc = result["calculated_nutrition"]
    food_info = result["food_info"]
    return {
        **calc,
        "food_key": food_info["key"],
        "food_name": food_info["display_name"],
        "category": food_info["category"],
        "source": food_info["nutrition_per_100g"].get("source", "Verified Nutritional Database"),
        "nutrients": calc.get("nutrients"),
        "per_100g": food_info["nutrition_per_100g"],
        "daily_values_percent": calc.get("daily_values_percent"),
        "energy_breakdown_percent": calc.get("energy_breakdown_percent"),
        "cache_lookup": {
            "status": coa_metrics["cache_status"],
            "latency_ms": round(coa_metrics["cache_lookup_us"] / 1000.0, 3),
            "saved_db_query": coa_metrics["cache_status"] == "HIT",
        },
        "food_info": food_info,
        "calculated_nutrition": calc,
        "coa_metrics": coa_metrics,
    }


@router.get("/history")
def get_history(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    """Retrieves previous food analysis history."""
    records = get_analysis_history(limit=limit, offset=offset)
    return {"total": len(records), "records": records}


@router.delete("/history/{item_id}")
def delete_single_history(item_id: int):
    """Deletes a single analysis record by ID."""
    success = delete_history_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="History item not found.")
    return {"success": True, "deleted_id": item_id}


@router.delete("/history")
def clear_history():
    """Clears all previous analysis records."""
    count = clear_all_history()
    return {"success": True, "deleted_count": count}


@router.get("/coa-stats")
def get_coa_statistics():
    """
    Returns live Computer Organization & Architecture telemetry:
    - Model RAM residency
    - LRU Cache telemetry (Hits, Misses, Hit Ratio, Evictions, MRU-to-LRU state)
    - Memory Hierarchy explanation and Latency Comparison table.
    """
    classifier = FoodClassifier.get_instance()
    cache_stats = nutrition_lru_cache.get_stats()

    latency_comparison = [
        {"tier": "Hardware L1/L2/L3 SRAM", "access_time": "~1 - 20 ns", "managed_by": "CPU Hardware / MMU", "role": "Micro-architectural register/cache lines"},
        {"tier": "Application LRU Cache", "access_time": f"~{cache_stats['avg_hit_latency_us']} µs ({cache_stats['avg_hit_latency_us']/1000:.3f} ms)", "managed_by": "Software RAM Hash-Map & Doubly-Linked List", "role": "High-speed nutrition record reuse"},
        {"tier": "RAM Model Inference", "access_time": f"~12 - 20 ms", "managed_by": "OS Virtual Memory / PyTorch Runtime", "role": "Pre-loaded MobileNetV3 weights (~15 MB)"},
        {"tier": "Secondary Storage (SQLite)", "access_time": f"~0.5 - 2.5 ms", "managed_by": "OS File System / Disk Storage", "role": "Persistent database & historical logs"},
    ]

    return {
        "model_memory": {
            "architecture": "MobileNetV3-Small",
            "is_resident_in_ram": classifier.is_loaded,
            "ram_size_mb": classifier.ram_resident_size_mb,
            "initial_load_time_ms": classifier.load_time_ms,
        },
        "lru_cache": cache_stats,
        "memory_hierarchy_table": latency_comparison,
        "coa_principle_statement": (
            "This application demonstrates the memory hierarchy principles of Computer Organization and Architecture. "
            "Model weights are kept resident in RAM to avoid redundant secondary storage disk I/O. "
            "Frequently accessed nutrition records are retained in an O(1) application-level LRU software cache. "
            "NOTE: This software LRU cache is an application-level demonstration of caching principles and temporal/spatial locality, "
            "and does not directly control physical hardware L1/L2/L3 SRAM cache lines."
        ),
    }


@router.post("/coa/clear-cache")
def reset_lru_cache():
    """Resets the LRU cache counters and data for interactive testing of cache misses."""
    nutrition_lru_cache.clear()
    return {"success": True, "message": "LRU Cache cleared. Subsequent lookups will register CACHE MISS."}
