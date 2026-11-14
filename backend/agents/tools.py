"""
Agent Tool Registry and Secure Workspace Execution Engine.
Provides tools for file inspection, editing, code execution, hardware telemetry,
inference benchmarking, cache profiling, testing, and inter-agent communication.
Strictly sandboxed to the project workspace.
"""

import os
import re
import sys
import time
import json
import psutil
import sqlite3
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import torch
from backend.config import BASE_DIR, REPORTS_DIR, REPORTS_COA_DIR, REPORTS_AI_DIR
from backend.agents.db_models import get_agent_db_connection


class WorkspaceSecurity:
    """Enforces file-system access constraints within the project workspace."""

    @staticmethod
    def validate_path(path_str: str) -> Path:
        """Resolves path and asserts it is within BASE_DIR."""
        resolved = (BASE_DIR / path_str).resolve() if not Path(path_str).is_absolute() else Path(path_str).resolve()
        try:
            resolved.relative_to(BASE_DIR.resolve())
        except ValueError:
            raise PermissionError(f"Access denied: Path '{path_str}' is outside the authorized project workspace.")
        return resolved


# ----------------------------------------------------------------------
# 1. File & Code Inspection Tools
# ----------------------------------------------------------------------

def read_project_file(rel_path: str, max_lines: int = 1500) -> Dict[str, Any]:
    """Reads the contents of a project file within the workspace."""
    try:
        path = WorkspaceSecurity.validate_path(rel_path)
        if not path.exists():
            return {"status": "error", "message": f"File '{rel_path}' does not exist."}
        if not path.is_file():
            return {"status": "error", "message": f"Path '{rel_path}' is a directory, not a file."}

        with open(path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        
        truncated = len(lines) > max_lines
        content = "".join(lines[:max_lines])
        return {
            "status": "success",
            "path": str(path.relative_to(BASE_DIR)),
            "total_lines": len(lines),
            "displayed_lines": min(len(lines), max_lines),
            "truncated": truncated,
            "content": content,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def list_workspace_files(sub_dir: str = "", pattern: str = "*") -> Dict[str, Any]:
    """Lists files and directories within a given workspace sub-directory."""
    try:
        path = WorkspaceSecurity.validate_path(sub_dir)
        if not path.exists():
            return {"status": "error", "message": f"Directory '{sub_dir}' does not exist."}

        items = []
        for p in path.glob(pattern):
            # Skip heavy or virtual directories
            if any(part in [".git", "node_modules", "__pycache__", ".pytest_cache", ".venv", "venv"] for part in p.parts):
                continue
            items.append({
                "name": p.name,
                "rel_path": str(p.relative_to(BASE_DIR)).replace("\\", "/"),
                "is_dir": p.is_dir(),
                "size_bytes": p.stat().st_size if p.is_file() else None,
            })
        return {"status": "success", "sub_dir": sub_dir, "count": len(items), "items": items[:200]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def search_workspace_code(query: str, extension: Optional[str] = None) -> Dict[str, Any]:
    """Searches for a text pattern across code files in the workspace."""
    try:
        matches = []
        ext_filter = f"*.{extension.lstrip('.')}" if extension else "*"
        for root, dirs, files in os.walk(BASE_DIR):
            dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "__pycache__", ".pytest_cache", ".venv", "dist"]]
            for file in files:
                if extension and not file.endswith(f".{extension.lstrip('.')}"):
                    continue
                filepath = Path(root) / file
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for line_idx, line in enumerate(f, start=1):
                            if query.lower() in line.lower():
                                matches.append({
                                    "file": str(filepath.relative_to(BASE_DIR)).replace("\\", "/"),
                                    "line": line_idx,
                                    "text": line.strip()[:140],
                                })
                                if len(matches) >= 50:
                                    break
                except Exception:
                    continue
            if len(matches) >= 50:
                break
        return {"status": "success", "query": query, "match_count": len(matches), "matches": matches}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def write_project_file(rel_path: str, content: str) -> Dict[str, Any]:
    """Creates or overwrites a project file within the authorized workspace."""
    try:
        path = WorkspaceSecurity.validate_path(rel_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return {
            "status": "success",
            "path": str(path.relative_to(BASE_DIR)).replace("\\", "/"),
            "bytes_written": len(content.encode("utf-8")),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def edit_project_file(rel_path: str, target: str, replacement: str) -> Dict[str, Any]:
    """Performs an exact string replacement within a file with automatic safety backup."""
    try:
        path = WorkspaceSecurity.validate_path(rel_path)
        if not path.is_file():
            return {"status": "error", "message": f"Target '{rel_path}' is not a file."}

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        if target not in content:
            return {"status": "error", "message": f"Target string not found in '{rel_path}'."}

        # Create safety backup
        backup_path = path.with_suffix(path.suffix + ".bak")
        with open(backup_path, "w", encoding="utf-8") as f:
            f.write(content)

        updated = content.replace(target, replacement, 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated)

        return {
            "status": "success",
            "path": str(path.relative_to(BASE_DIR)).replace("\\", "/"),
            "backup_created": str(backup_path.relative_to(BASE_DIR)).replace("\\", "/"),
            "message": "Replacement applied successfully.",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ----------------------------------------------------------------------
# 2. Command Execution & Testing
# ----------------------------------------------------------------------

APPROVED_COMMAND_PREFIXES = ["python", "pytest", "pip list", "node", "npm test", "git status"]

def execute_terminal_command(command: str, timeout_sec: int = 40) -> Dict[str, Any]:
    """Executes an approved terminal command within the project workspace."""
    cmd_clean = command.strip()
    is_approved = any(cmd_clean.startswith(prefix) for prefix in APPROVED_COMMAND_PREFIXES)
    if not is_approved:
        return {
            "status": "error",
            "message": f"Security restriction: Command '{cmd_clean.split()[0]}' is not in the approved whitelist {APPROVED_COMMAND_PREFIXES}.",
        }

    try:
        start_t = time.perf_counter()
        result = subprocess.run(
            cmd_clean,
            shell=True,
            cwd=str(BASE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_sec,
        )
        duration_ms = (time.perf_counter() - start_t) * 1000
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "command": cmd_clean,
            "returncode": result.returncode,
            "stdout": result.stdout[-4000:] if len(result.stdout) > 4000 else result.stdout,
            "stderr": result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr,
            "duration_ms": round(duration_ms, 2),
        }
    except subprocess.TimeoutExpired:
        return {"status": "timeout", "command": cmd_clean, "duration_ms": float(timeout_sec * 1000), "message": f"Execution timed out after {timeout_sec}s."}
    except Exception as e:
        return {"status": "error", "command": cmd_clean, "duration_ms": 0.0, "message": str(e)}


def run_pytest_suite(test_target: str = "backend/tests/") -> Dict[str, Any]:
    """Executes pytest on a specified target and returns parsed test results."""
    cmd = f"{sys.executable} -m pytest {test_target} -v"
    res = execute_terminal_command(cmd, timeout_sec=60)
    stdout = res.get("stdout", "")

    # Parse passed/failed counts
    passed_match = re.search(r"(\d+) passed", stdout)
    failed_match = re.search(r"(\d+) failed", stdout)
    passed_count = int(passed_match.group(1)) if passed_match else 0
    failed_count = int(failed_match.group(1)) if failed_match else 0

    return {
        "status": res.get("status"),
        "test_target": test_target,
        "passed": passed_count,
        "failed": failed_count,
        "duration_ms": float(res.get("duration_ms") or 0.0),
        "stdout_summary": stdout[-2000:] if len(stdout) > 2000 else stdout,
    }


# ----------------------------------------------------------------------
# 3. Hardware & COA Telemetry Tools
# ----------------------------------------------------------------------

def measure_hardware_metrics() -> Dict[str, Any]:
    """Measures real system CPU, RAM, and PyTorch CUDA hardware metrics using psutil and torch."""
    proc = psutil.Process(os.getpid())
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_count_logical = psutil.cpu_count(logical=True)
    cpu_count_physical = psutil.cpu_count(logical=False)
    mem = psutil.virtual_memory()

    # Process memory
    proc_mem = proc.memory_info()
    proc_rss_mb = round(proc_mem.rss / (1024 * 1024), 2)

    # PyTorch / CUDA metrics
    cuda_available = torch.cuda.is_available()
    cuda_device_count = torch.cuda.device_count()
    cuda_device_name = torch.cuda.get_device_name(0) if cuda_available and cuda_device_count > 0 else "None (CPU Execution Only)"
    torch_threads = torch.get_num_threads()

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu": {
            "utilization_percent": cpu_percent,
            "physical_cores": cpu_count_physical,
            "logical_cores": cpu_count_logical,
            "torch_intraop_threads": torch_threads,
        },
        "memory": {
            "total_system_mb": round(mem.total / (1024 * 1024), 2),
            "available_system_mb": round(mem.available / (1024 * 1024), 2),
            "system_percent_used": mem.percent,
            "process_rss_mb": proc_rss_mb,
        },
        "accelerator": {
            "cuda_available": cuda_available,
            "device_count": cuda_device_count,
            "device_name": cuda_device_name,
            "pytorch_version": torch.__version__,
        },
    }


def benchmark_model_inference(sample_image_rel_path: Optional[str] = None, runs: int = 15) -> Dict[str, Any]:
    """Executes actual PyTorch MobileNetV3 inference runs on a real food image and measures latency statistics."""
    try:
        from backend.models.food_classifier import FoodClassifier
        from backend.services.image_processor import preprocess_transform
        from PIL import Image

        classifier = FoodClassifier.get_instance()
        if classifier.model is None:
            classifier.load_model()

        # Resolve sample image
        if sample_image_rel_path:
            img_path = WorkspaceSecurity.validate_path(sample_image_rel_path)
        else:
            # Pick first available test image from processed or raw test set
            test_dir = BASE_DIR / "datasets" / "processed" / "test"
            if not test_dir.exists():
                test_dir = BASE_DIR / "datasets" / "raw"
            images = list(test_dir.glob("*/*.jpg")) + list(test_dir.glob("*/*.png"))
            if not images:
                return {"status": "error", "message": "No sample test images found in datasets/processed/test/."}
            img_path = images[0]

        img = Image.open(img_path).convert("RGB")
        tensor = preprocess_transform(img).unsqueeze(0)

        # Warm-up (absorb cold start)
        for _ in range(2):
            classifier.predict(tensor)

        latencies_ms = []
        for _ in range(max(1, runs)):
            t0 = time.perf_counter()
            pred = classifier.predict(tensor)
            dt_ms = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(dt_ms)

        latencies_ms.sort()
        mean_lat = sum(latencies_ms) / len(latencies_ms)
        min_lat = latencies_ms[0]
        max_lat = latencies_ms[-1]
        p95_lat = latencies_ms[int(len(latencies_ms) * 0.95)]

        return {
            "status": "success",
            "image": str(img_path.relative_to(BASE_DIR)).replace("\\", "/"),
            "runs": len(latencies_ms),
            "min_ms": round(min_lat, 2),
            "mean_ms": round(mean_lat, 2),
            "p95_ms": round(p95_lat, 2),
            "max_ms": round(max_lat, 2),
            "model_ram_resident_mb": classifier.ram_resident_size_mb,
            "top_prediction": pred.get("top_prediction") if isinstance(pred, dict) else None,
            "top_confidence": pred.get("top_confidence") if isinstance(pred, dict) else None,
            "top_k": pred.get("top_k_predictions", []) if isinstance(pred, dict) else [],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def benchmark_lru_cache(food_key: str = "chicken_biryani", runs: int = 50) -> Dict[str, Any]:
    """Benchmarks the application LRU cache (doubly-linked list + hash map) against SQLite disk lookups."""
    try:
        from backend.cache.lru_cache import nutrition_lru_cache
        from backend.database.db import get_food_by_key

        lru = nutrition_lru_cache
        lru.clear()
        res = get_food_by_key(food_key)
        if not res or not res[0]:
            return {"status": "error", "message": f"Food key '{food_key}' not found in database."}

        food_record, db_time_ms = res

        # Insert into LRU cache
        lru.put(food_key, food_record)

        # Measure cached lookups
        cache_latencies_us = []
        for _ in range(runs):
            t_c0 = time.perf_counter()
            cached_val = lru.get(food_key)
            dt_us = (time.perf_counter() - t_c0) * 1_000_000.0
            cache_latencies_us.append(dt_us)

        mean_cache_us = sum(cache_latencies_us) / len(cache_latencies_us)
        mean_cache_ms = mean_cache_us / 1000.0
        speedup = db_time_ms / max(mean_cache_ms, 0.0001)

        return {
            "status": "success",
            "food_key": food_key,
            "uncached_sqlite_ms": round(db_time_ms, 3),
            "cached_lru_mean_us": round(mean_cache_us, 2),
            "cached_lru_mean_ms": round(mean_cache_ms, 4),
            "speedup_ratio": round(speedup, 1),
            "lru_stats": lru.get_stats(),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ----------------------------------------------------------------------
# 4. Deliverables & Inter-Agent Communication
# ----------------------------------------------------------------------

def save_report_deliverable(
    title: str,
    category: str,
    content: str,
    rel_filename: str,
    agent_id: str,
    task_id: Optional[str] = None,
    summary: str = "",
) -> Dict[str, Any]:
    """Saves a formal report or architecture deliverable to disk and registers it in the agent database."""
    try:
        if category == "coa":
            target_dir = REPORTS_COA_DIR
        elif category == "ai_engineer":
            target_dir = REPORTS_AI_DIR
        else:
            target_dir = REPORTS_DIR / category
        target_dir.mkdir(parents=True, exist_ok=True)

        file_path = target_dir / rel_filename
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        rel_path_str = str(file_path.relative_to(BASE_DIR)).replace("\\", "/")

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO agent_reports (task_id, agent_id, title, category, file_path, summary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id,
                agent_id,
                title,
                category,
                rel_path_str,
                summary or title,
                datetime.now(timezone.utc).isoformat(),
            ))
            report_id = cursor.lastrowid
            conn.commit()

        return {
            "status": "success",
            "report_id": report_id,
            "title": title,
            "category": category,
            "file_path": rel_path_str,
            "bytes": len(content.encode("utf-8")),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def send_agent_message(
    sender: str,
    recipient: str,
    content: str,
    task_id: Optional[str] = None,
    message_type: str = "chat",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Records an inter-agent or agent-to-user message in the shared communication log."""
    try:
        meta_json = json.dumps(metadata) if metadata else None
        now_iso = datetime.now(timezone.utc).isoformat()
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO agent_messages (sender, recipient, task_id, content, message_type, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (sender, recipient, task_id, content, message_type, now_iso, meta_json))
            msg_id = cursor.lastrowid
            conn.commit()

        return {
            "status": "success",
            "message_id": msg_id,
            "sender": sender,
            "recipient": recipient,
            "task_id": task_id,
            "timestamp": now_iso,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
