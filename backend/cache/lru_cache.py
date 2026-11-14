"""
LRU (Least Recently Used) Software Cache Implementation for COA Integration.
Demonstrates Computer Organization & Architecture memory hierarchy principles:
- CPU Registers / ALU -> Hardware Caches (L1/L2/L3) -> RAM (Model Weights resident)
  -> Application Software LRU Cache -> Secondary Storage (SQLite Disk I/O).

Implements classic Doubly-Linked List + Hash Map for O(1) lookup, insertion, and eviction.
Instruments nanosecond/microsecond access latencies to compare against secondary storage.

NOTE: This software LRU cache is an application-level demonstration of caching concepts,
spatial/temporal locality, and hit/miss mechanics. It does not directly manipulate
the CPU's physical hardware L1/L2/L3 SRAM cache lines.
"""

import time
import threading
from typing import Any, Optional, Dict, List, Tuple


class LRUNode:
    def __init__(self, key: str, value: Any):
        self.key = key
        self.value = value
        self.prev: Optional["LRUNode"] = None
        self.next: Optional["LRUNode"] = None
        self.created_at = time.time()
        self.last_accessed_at = time.time()
        self.access_count = 1


class LRUCache:
    def __init__(self, capacity: int = 6):
        if capacity <= 0:
            raise ValueError("Capacity must be greater than 0")
        self.capacity = capacity
        self.cache: Dict[str, LRUNode] = {}
        self.lock = threading.RLock()

        # Dummy head and tail for clean doubly-linked list manipulation
        self.head = LRUNode("__HEAD__", None)
        self.tail = LRUNode("__TAIL__", None)
        self.head.next = self.tail
        self.tail.prev = self.head

        # Telemetry and COA performance counters
        self.total_lookups = 0
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.recent_events: List[Dict[str, Any]] = []
        self.cache_hit_latencies_us: List[float] = []
        self.cache_miss_latencies_us: List[float] = []

    def _add_node_to_front(self, node: LRUNode):
        """Place node directly after head (Most Recently Used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def _remove_node(self, node: LRUNode):
        """Unlink node from doubly-linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node

    def _move_to_front(self, node: LRUNode):
        """Move existing node to Most Recently Used position."""
        self._remove_node(node)
        self._add_node_to_front(node)
        node.last_accessed_at = time.time()
        node.access_count += 1

    def _evict_least_recently_used(self) -> Tuple[str, Any]:
        """Evict node directly before tail (Least Recently Used)."""
        lru_node = self.tail.prev
        if lru_node == self.head:
            return None, None
        self._remove_node(lru_node)
        del self.cache[lru_node.key]
        self.evictions += 1
        return lru_node.key, lru_node.value

    def get(self, key: str) -> Tuple[Optional[Any], bool, float]:
        """
        Retrieves a record by key.
        Returns: (value, is_hit, lookup_latency_microseconds)
        """
        t0 = time.perf_counter_ns()
        with self.lock:
            self.total_lookups += 1
            if key in self.cache:
                node = self.cache[key]
                self._move_to_front(node)
                self.hits += 1
                t1 = time.perf_counter_ns()
                latency_us = (t1 - t0) / 1000.0
                self.cache_hit_latencies_us.append(latency_us)

                event = {
                    "type": "HIT",
                    "key": key,
                    "latency_us": round(latency_us, 2),
                    "timestamp": time.time(),
                    "position": "MRU (Promoted)",
                }
                self._record_event(event)
                return node.value, True, latency_us
            else:
                self.misses += 1
                t1 = time.perf_counter_ns()
                latency_us = (t1 - t0) / 1000.0
                self.cache_miss_latencies_us.append(latency_us)

                event = {
                    "type": "MISS",
                    "key": key,
                    "latency_us": round(latency_us, 2),
                    "timestamp": time.time(),
                    "position": "Not Found",
                }
                self._record_event(event)
                return None, False, latency_us

    def put(self, key: str, value: Any) -> Dict[str, Any]:
        """
        Inserts or updates a record.
        Handles eviction if capacity is exceeded.
        Returns details of insertion and eviction if triggered.
        """
        t0 = time.perf_counter_ns()
        with self.lock:
            evicted_key = None
            if key in self.cache:
                node = self.cache[key]
                node.value = value
                self._move_to_front(node)
                action = "UPDATE"
            else:
                if len(self.cache) >= self.capacity:
                    evicted_key, _ = self._evict_least_recently_used()
                new_node = LRUNode(key, value)
                self.cache[key] = new_node
                self._add_node_to_front(new_node)
                action = "INSERT"

            t1 = time.perf_counter_ns()
            latency_us = (t1 - t0) / 1000.0

            event = {
                "type": action,
                "key": key,
                "evicted_key": evicted_key,
                "latency_us": round(latency_us, 2),
                "timestamp": time.time(),
                "cache_size": len(self.cache),
            }
            self._record_event(event)
            return event

    def clear(self):
        """Clears cache state."""
        with self.lock:
            self.cache.clear()
            self.head.next = self.tail
            self.tail.prev = self.head
            self.total_lookups = 0
            self.hits = 0
            self.misses = 0
            self.evictions = 0
            self.recent_events.clear()
            self.cache_hit_latencies_us.clear()
            self.cache_miss_latencies_us.clear()

    def _record_event(self, event: Dict[str, Any]):
        self.recent_events.append(event)
        if len(self.recent_events) > 50:
            self.recent_events.pop(0)

    def get_stats(self) -> Dict[str, Any]:
        """Returns comprehensive telemetry for COA dashboard."""
        with self.lock:
            hit_ratio = (self.hits / self.total_lookups * 100) if self.total_lookups > 0 else 0.0
            avg_hit_us = (sum(self.cache_hit_latencies_us) / len(self.cache_hit_latencies_us)) if self.cache_hit_latencies_us else 0.0
            avg_miss_us = (sum(self.cache_miss_latencies_us) / len(self.cache_miss_latencies_us)) if self.cache_miss_latencies_us else 0.0

            # List keys ordered from MRU to LRU
            ordered_keys = []
            curr = self.head.next
            while curr != self.tail:
                ordered_keys.append({
                    "key": curr.key,
                    "access_count": curr.access_count,
                    "age_seconds": round(time.time() - curr.created_at, 1),
                })
                curr = curr.next

            return {
                "capacity": self.capacity,
                "current_size": len(self.cache),
                "total_lookups": self.total_lookups,
                "hits": self.hits,
                "misses": self.misses,
                "evictions": self.evictions,
                "hit_ratio_percent": round(hit_ratio, 2),
                "avg_hit_latency_us": round(avg_hit_us, 2),
                "avg_miss_latency_us": round(avg_miss_us, 2),
                "items_mru_to_lru": ordered_keys,
                "recent_events": self.recent_events[-10:],
            }


# Singleton cache instance across backend
nutrition_lru_cache = LRUCache(capacity=6)
