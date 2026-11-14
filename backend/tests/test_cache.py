"""
Unit tests for COA LRU Cache Implementation.
Tests hit, miss, insertion, LRU eviction, and telemetry metrics.
"""

import pytest
from backend.cache.lru_cache import LRUCache


def test_cache_miss_and_insertion():
    cache = LRUCache(capacity=3)
    val, is_hit, latency = cache.get("item1")
    assert val is None
    assert is_hit is False
    assert cache.misses == 1

    event = cache.put("item1", {"name": "Biryani", "cals": 181})
    assert event["type"] == "INSERT"
    assert event["evicted_key"] is None

    # Next lookup should be a HIT
    val, is_hit, latency = cache.get("item1")
    assert is_hit is True
    assert val["name"] == "Biryani"
    assert cache.hits == 1
    assert cache.total_lookups == 2


def test_lru_eviction():
    cache = LRUCache(capacity=3)
    cache.put("k1", 100)
    cache.put("k2", 200)
    cache.put("k3", 300)

    # Access k1 so k2 becomes the Least Recently Used
    cache.get("k1")

    # Inserting 4th item should evict k2
    event = cache.put("k4", 400)
    assert event["evicted_key"] == "k2"
    assert cache.evictions == 1

    # k2 should now be a MISS
    val, is_hit, _ = cache.get("k2")
    assert is_hit is False
    assert val is None

    # k1, k3, k4 should still be in cache
    v1, h1, _ = cache.get("k1")
    v3, h3, _ = cache.get("k3")
    v4, h4, _ = cache.get("k4")
    assert h1 is True and v1 == 100
    assert h3 is True and v3 == 300
    assert h4 is True and v4 == 400


def test_cache_telemetry_stats():
    cache = LRUCache(capacity=4)
    cache.put("a", 1)
    cache.get("a")  # hit
    cache.get("b")  # miss

    stats = cache.get_stats()
    assert stats["capacity"] == 4
    assert stats["current_size"] == 1
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_ratio_percent"] == 50.0
    assert len(stats["items_mru_to_lru"]) == 1
    assert stats["items_mru_to_lru"][0]["key"] == "a"
