"""
Database management module for Food Recognition & Nutrition Tracker.
Handles SQLite connection, schema initialization, verified seed population,
and atomic queries with microsecond latency profiling.
"""

import sqlite3
import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from backend.database.schema import SCHEMA_SQL
from backend.database.seed_data import VERIFIED_FOODS

DB_PATH = Path(__file__).resolve().parent / "food_nutrition.db"


def get_db_connection():
    """Create a connection with foreign key support and dict-like row access."""
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes the database schema and populates verified seed data if empty."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.executescript(SCHEMA_SQL)
        conn.commit()

        # Check if foods table already has rows
        cursor.execute("SELECT COUNT(*) FROM foods;")
        count = cursor.fetchone()[0]

        if count == 0:
            print("[Database] Seeding verified nutritional database...")
            for item in VERIFIED_FOODS:
                cursor.execute(
                    """
                    INSERT INTO foods (
                        key, display_name, category, cuisine, default_serving_g,
                        serving_unit_description, description, density_g_ml
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        item["key"],
                        item["display_name"],
                        item["category"],
                        item["cuisine"],
                        item["default_serving_g"],
                        item["serving_unit_description"],
                        item["description"],
                        item["density_g_ml"],
                    ),
                )
                food_id = cursor.lastrowid

                # Insert nutrition per 100g
                nut = item["nutrition_per_100g"]
                cursor.execute(
                    """
                    INSERT INTO nutrition (
                        food_id, calories_kcal, protein_g, carbs_g, fat_g, fiber_g,
                        sugar_g, sodium_mg, source, verified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
                    """,
                    (
                        food_id,
                        nut["calories_kcal"],
                        nut["protein_g"],
                        nut["carbs_g"],
                        nut["fat_g"],
                        nut["fiber_g"],
                        nut.get("sugar_g", 0.0),
                        nut.get("sodium_mg", 0.0),
                        nut["source"],
                    ),
                )

                # Insert synonyms
                for syn in item.get("synonyms", []):
                    norm = syn.strip().lower()
                    cursor.execute(
                        """
                        INSERT INTO food_synonyms (food_id, synonym, normalized_synonym)
                        VALUES (?, ?, ?);
                        """,
                        (food_id, syn, norm),
                    )
            conn.commit()
            print(f"[Database] Successfully seeded {len(VERIFIED_FOODS)} verified foods with nutritional composition.")
    finally:
        conn.close()


def get_food_by_key(food_key: str) -> Tuple[Optional[Dict[str, Any]], float]:
    """
    Retrieves full food record and nutrition by key.
    Profiles disk/database query time in milliseconds.
    """
    t0 = time.perf_counter()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                f.id, f.key, f.display_name, f.category, f.cuisine,
                f.default_serving_g, f.serving_unit_description, f.description, f.density_g_ml,
                n.calories_kcal, n.protein_g, n.carbs_g, n.fat_g, n.fiber_g,
                n.sugar_g, n.sodium_mg, n.source, n.verified
            FROM foods f
            JOIN nutrition n ON f.id = n.food_id
            WHERE f.key = ?;
            """,
            (food_key,),
        )
        row = cursor.fetchone()
        t1 = time.perf_counter()
        lookup_ms = (t1 - t0) * 1000.0

        if not row:
            return None, lookup_ms

        food_data = {
            "id": row["id"],
            "key": row["key"],
            "display_name": row["display_name"],
            "category": row["category"],
            "cuisine": row["cuisine"],
            "default_serving_g": row["default_serving_g"],
            "serving_unit_description": row["serving_unit_description"],
            "description": row["description"],
            "density_g_ml": row["density_g_ml"],
            "nutrition_per_100g": {
                "calories_kcal": row["calories_kcal"],
                "protein_g": row["protein_g"],
                "carbs_g": row["carbs_g"],
                "fat_g": row["fat_g"],
                "fiber_g": row["fiber_g"],
                "sugar_g": row["sugar_g"],
                "sodium_mg": row["sodium_mg"],
                "source": row["source"],
                "verified": bool(row["verified"]),
            },
        }
        cursor.execute("SELECT synonym FROM food_synonyms WHERE food_id = ?;", (row["id"],))
        food_data["synonyms"] = [r["synonym"] for r in cursor.fetchall()]
        return food_data, lookup_ms
    finally:
        conn.close()


def get_food_by_id(food_id: int) -> Tuple[Optional[Dict[str, Any]], float]:
    """Retrieves full food record and nutrition by ID."""
    t0 = time.perf_counter()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                f.id, f.key, f.display_name, f.category, f.cuisine,
                f.default_serving_g, f.serving_unit_description, f.description, f.density_g_ml,
                n.calories_kcal, n.protein_g, n.carbs_g, n.fat_g, n.fiber_g,
                n.sugar_g, n.sodium_mg, n.source, n.verified
            FROM foods f
            JOIN nutrition n ON f.id = n.food_id
            WHERE f.id = ?;
            """,
            (food_id,),
        )
        row = cursor.fetchone()
        t1 = time.perf_counter()
        lookup_ms = (t1 - t0) * 1000.0

        if not row:
            return None, lookup_ms

        food_data = {
            "id": row["id"],
            "key": row["key"],
            "display_name": row["display_name"],
            "category": row["category"],
            "cuisine": row["cuisine"],
            "default_serving_g": row["default_serving_g"],
            "serving_unit_description": row["serving_unit_description"],
            "description": row["description"],
            "density_g_ml": row["density_g_ml"],
            "nutrition_per_100g": {
                "calories_kcal": row["calories_kcal"],
                "protein_g": row["protein_g"],
                "carbs_g": row["carbs_g"],
                "fat_g": row["fat_g"],
                "fiber_g": row["fiber_g"],
                "sugar_g": row["sugar_g"],
                "sodium_mg": row["sodium_mg"],
                "source": row["source"],
                "verified": bool(row["verified"]),
            },
        }
        cursor.execute("SELECT synonym FROM food_synonyms WHERE food_id = ?;", (row["id"],))
        food_data["synonyms"] = [r["synonym"] for r in cursor.fetchall()]
        return food_data, lookup_ms
    finally:
        conn.close()


def get_all_foods() -> List[Dict[str, Any]]:
    """Returns list of all available foods with default servings and categories."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, key, display_name, category, cuisine, default_serving_g, serving_unit_description
            FROM foods
            ORDER BY display_name ASC;
            """
        )
        return [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()


def save_analysis_history(
    timestamp: str,
    input_food_name: Optional[str],
    predicted_food_id: Optional[int],
    predicted_food_name: str,
    confidence_score: float,
    match_status: str,
    serving_weight_g: float,
    calories_kcal: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    fiber_g: float,
    image_filename: Optional[str],
    inference_time_ms: float,
    db_lookup_time_ms: float,
    cache_hit: int,
) -> int:
    """Inserts a record into analysis_history table."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO analysis_history (
                timestamp, input_food_name, predicted_food_id, predicted_food_name,
                confidence_score, match_status, serving_weight_g, calories_kcal,
                protein_g, carbs_g, fat_g, fiber_g, image_filename,
                inference_time_ms, db_lookup_time_ms, cache_hit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                timestamp,
                input_food_name,
                predicted_food_id,
                predicted_food_name,
                confidence_score,
                match_status,
                serving_weight_g,
                calories_kcal,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                image_filename,
                inference_time_ms,
                db_lookup_time_ms,
                cache_hit,
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_analysis_history(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieves previous analysis records ordered by newest first."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM analysis_history
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?;
            """,
            (limit, offset),
        )
        return [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()


def delete_history_item(item_id: int) -> bool:
    """Deletes an item from history."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_history WHERE id = ?;", (item_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def clear_all_history() -> int:
    """Clears all history records."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_history;")
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()
