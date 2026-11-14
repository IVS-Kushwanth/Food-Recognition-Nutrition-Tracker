"""
Comprehensive Test Suite for Autonomous AI Agents (Bot A & Bot B)
and Agent Management Control Center.
Verifies:
- Test 1: Bot A CPU registers & ALU research task and report deliverable
- Test 2: Bot B ML model inference benchmarking and latency distribution
- Test 3: Collaborative task with inter-agent communication & telemetry exchange
- Test 4: Bot B bug diagnosis and test suite execution
- Test 5: Agent REST API endpoints, task lifecycles, execution logs, and reports
"""

import time
import pytest
from pathlib import Path

from backend.config import BASE_DIR, REPORTS_COA_DIR, REPORTS_AI_DIR
from backend.agents.db_models import init_agent_db, get_agent_db_connection
from backend.agents.tools import (
    measure_hardware_metrics,
    benchmark_model_inference,
    benchmark_lru_cache,
    read_project_file,
    list_workspace_files,
    execute_terminal_command,
    save_report_deliverable,
    send_agent_message,
)
from backend.agents.bot_a_coa import BotACOAResearcher
from backend.agents.bot_b_engineer import BotBAIEngineer
from backend.agents.coordinator import AgentCoordinator


@pytest.fixture(scope="module", autouse=True)
def setup_agent_env():
    init_agent_db()


def test_hardware_telemetry_tool():
    """Verifies that psutil and torch hardware measurements are non-fabricated and accurate."""
    hw = measure_hardware_metrics()
    assert hw["status"] == "success"
    assert hw["cpu"]["physical_cores"] > 0
    assert hw["cpu"]["logical_cores"] >= hw["cpu"]["physical_cores"]
    assert hw["memory"]["process_rss_mb"] > 0
    assert "cuda_available" in hw["accelerator"]
    assert hw["accelerator"]["device_name"] is not None


def test_lru_cache_benchmark_tool():
    """Verifies the LRU cache benchmark tool calculates real hit/miss latencies and speedup."""
    res = benchmark_lru_cache("chicken_biryani", runs=20)
    assert res["status"] == "success"
    assert res["uncached_sqlite_ms"] > 0
    assert res["cached_lru_mean_us"] > 0
    assert res["speedup_ratio"] > 1.0  # In-memory cache must be faster than SQLite disk


def test_model_inference_benchmark_tool():
    """Verifies real PyTorch MobileNetV3 inference execution and statistics."""
    res = benchmark_model_inference(runs=3)
    assert res["status"] == "success"
    assert res["mean_ms"] > 0
    assert res["min_ms"] <= res["mean_ms"] <= res["max_ms"]
    assert res["model_ram_resident_mb"] > 0
    assert res["top_prediction"] is not None


def test_bot_a_research_registers_and_alu_task():
    """TEST 1: Assign Bot A CPU registers & ALU research task. Verifies report deliverable."""
    bot_a = BotACOAResearcher()
    task = {
        "id": f"test_task_coa_{int(time.time())}",
        "title": "Research CPU registers and ALU operations",
        "description": "Investigate register allocation and ALU MAC operations during MobileNetV3 inference.",
        "assigned_to": "bot_a",
    }
    result = bot_a.execute_task(task)
    assert result["status"] == "completed"
    assert len(result["deliverables"]) > 0

    deliverable_path = BASE_DIR / result["deliverables"][0]
    assert deliverable_path.exists()
    content = deliverable_path.read_text(encoding="utf-8")
    assert "CPU Registers" in content
    assert "ALU Operations" in content
    assert "MobileNetV3" in content


def test_bot_b_inference_benchmark_task():
    """TEST 2: Assign Bot B ML inference task. Verifies empirical benchmark report."""
    bot_b = BotBAIEngineer()
    task = {
        "id": f"test_task_inf_{int(time.time())}",
        "title": "Measure food image recognition inference time",
        "description": "Benchmark MobileNetV3 forward pass latency distribution on CPU.",
        "assigned_to": "bot_b",
    }
    result = bot_b.execute_task(task)
    assert result["status"] == "completed"
    assert len(result["deliverables"]) > 0

    deliverable_path = BASE_DIR / result["deliverables"][0]
    assert deliverable_path.exists()
    content = deliverable_path.read_text(encoding="utf-8")
    assert "Inference Latency Distribution" in content
    assert "Mean Latency" in content


def test_collaborative_workflow_and_communication():
    """TEST 3: Coordinated task where Bot B gathers telemetry and Bot A synthesizes COA report."""
    coordinator = AgentCoordinator.get_instance()
    task = coordinator.create_task(
        title="Collaborative Memory Hierarchy and Caching Analysis",
        description="Bot B profiles LRU cache and RAM; Bot A produces comprehensive COA documentation.",
        assigned_to="collaborative",
        auto_start=False,
    )
    # Execute collaborative workflow
    coordinator._execute_collaborative_workflow(task)

    updated_task = coordinator.get_task_by_id(task["id"])
    assert updated_task["status"] == "completed"
    assert len(updated_task["deliverables"]) >= 2  # Bot B deliverable + Bot A deliverable

    # Verify inter-agent messages passed between Bot A and Bot B
    msgs = coordinator.get_messages(task_id=task["id"])
    assert len(msgs) > 0


def test_bot_b_codebase_verification_task():
    """TEST 4: Assign Bot B codebase verification task. Verifies automated test execution."""
    bot_b = BotBAIEngineer()
    task = {
        "id": f"test_task_verify_{int(time.time())}",
        "title": "Verify codebase stability and test suite",
        "description": "Run unit test suite and confirm zero regressions.",
        "assigned_to": "bot_b",
    }
    result = bot_b.execute_task(task)
    assert result["status"] == "completed"
    assert len(result["deliverables"]) > 0


def test_agent_api_endpoints():
    """TEST 5: Tests the REST API routes for Agent Control Center."""
    from backend.api.agent_routes import (
        get_agents_overview,
        get_live_metrics,
        list_tasks,
        get_messages,
        list_reports,
    )

    overview = get_agents_overview()
    assert "agents" in overview
    assert len(overview["agents"]) == 2
    assert "counts" in overview
    assert "system_hardware" in overview

    metrics = get_live_metrics()
    assert metrics["cpu"]["physical_cores"] > 0

    tasks_res = list_tasks(limit=10, offset=0)
    assert "tasks" in tasks_res
    assert len(tasks_res["tasks"]) > 0

    msgs_res = get_messages(limit=10, offset=0)
    assert "messages" in msgs_res

    reports_res = list_reports(limit=10)
    assert "reports" in reports_res
    assert len(reports_res["reports"]) > 0
