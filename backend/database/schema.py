"""
Database schema for Food Recognition & Nutrition Tracker.
Uses SQLite with foreign keys, indexes, and comprehensive nutritional metadata.
"""

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    default_serving_g REAL NOT NULL,
    serving_unit_description TEXT NOT NULL,
    description TEXT,
    density_g_ml REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id INTEGER NOT NULL,
    calories_kcal REAL NOT NULL,
    protein_g REAL NOT NULL,
    carbs_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    fiber_g REAL NOT NULL,
    sugar_g REAL DEFAULT 0.0,
    sodium_mg REAL DEFAULT 0.0,
    source TEXT NOT NULL,
    verified INTEGER DEFAULT 1,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_synonyms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id INTEGER NOT NULL,
    synonym TEXT NOT NULL,
    normalized_synonym TEXT NOT NULL,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    input_food_name TEXT,
    predicted_food_id INTEGER,
    predicted_food_name TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    match_status TEXT NOT NULL,
    serving_weight_g REAL NOT NULL,
    calories_kcal REAL NOT NULL,
    protein_g REAL NOT NULL,
    carbs_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    fiber_g REAL NOT NULL,
    image_filename TEXT,
    inference_time_ms REAL NOT NULL,
    db_lookup_time_ms REAL NOT NULL,
    cache_hit INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (predicted_food_id) REFERENCES foods(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cache_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    total_lookups INTEGER NOT NULL,
    cache_hits INTEGER NOT NULL,
    cache_misses INTEGER NOT NULL,
    hit_ratio REAL NOT NULL,
    eviction_count INTEGER NOT NULL,
    current_cache_size INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foods_key ON foods(key);
CREATE INDEX IF NOT EXISTS idx_foods_display ON foods(display_name);
CREATE INDEX IF NOT EXISTS idx_nutrition_food_id ON nutrition(food_id);
CREATE INDEX IF NOT EXISTS idx_synonyms_norm ON food_synonyms(normalized_synonym);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON analysis_history(timestamp DESC);
"""
