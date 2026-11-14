"""
FastAPI Routes for Autonomous Agents Control Center.
Provides endpoints for task management, agent state monitoring,
inter-agent messaging, hardware telemetry, and report retrieval.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from backend.config import BASE_DIR
from backend.agents.coordinator import AgentCoordinator
from backend.agents.tools import send_agent_message, measure_hardware_metrics

router = APIRouter(prefix="/api/agents", tags=["Autonomous Agents"])
coordinator = AgentCoordinator.get_instance()


# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------

class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, example="Research CPU registers and ALU operations")
    description: str = Field(..., min_length=5, example="Investigate CPU registers during MobileNetV3 inference.")
    assigned_to: str = Field("bot_a", example="bot_a")  # 'bot_a', 'bot_b', 'collaborative'
    priority: str = Field("medium", example="high")      # 'low', 'medium', 'high', 'critical'
    dependencies: Optional[List[str]] = Field(default=None, example=[])
    auto_start: bool = Field(default=True, example=True)


class SendMessageRequest(BaseModel):
    sender: str = Field("user", example="user")
    recipient: str = Field("bot_a", example="bot_a")
    content: str = Field(..., min_length=1, example="Hello Bot A, what are the L1 cache findings?")
    task_id: Optional[str] = Field(default=None, example="task_abc123")
    message_type: str = Field("chat", example="chat")


# -------------------------------------------------------------------------
# Agent State & Hardware Telemetry
# -------------------------------------------------------------------------

@router.get("")
def get_agents_overview():
    """Returns real-time status of Bot A, Bot B, task counts, and system hardware telemetry."""
    return coordinator.get_agents_status()


@router.get("/metrics")
def get_live_metrics():
    """Returns high-resolution hardware metrics: CPU %, RAM MB, and CUDA accelerator detection."""
    return measure_hardware_metrics()


# -------------------------------------------------------------------------
# Task Management Endpoints
# -------------------------------------------------------------------------

@router.get("/tasks")
def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status: pending, in_progress, completed, failed, cancelled"),
    assigned_to: Optional[str] = Query(None, description="Filter by agent: bot_a, bot_b, collaborative"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Retrieves list of agent tasks with optional status and assignee filters."""
    s_val = status if isinstance(status, str) else None
    a_val = assigned_to if isinstance(assigned_to, str) else None
    l_val = limit if isinstance(limit, int) else 50
    o_val = offset if isinstance(offset, int) else 0
    tasks = coordinator.get_tasks(status=s_val, assigned_to=a_val, limit=l_val, offset=o_val)
    return {"tasks": tasks, "count": len(tasks)}


@router.post("/tasks")
def create_new_task(payload: CreateTaskRequest):
    """Creates a new autonomous task and optionally launches immediate background execution."""
    task = coordinator.create_task(
        title=payload.title,
        description=payload.description,
        assigned_to=payload.assigned_to,
        priority=payload.priority,
        dependencies=payload.dependencies,
        auto_start=payload.auto_start,
    )
    return {"status": "created", "task": task}


@router.get("/tasks/{task_id}")
def get_task_details(task_id: str):
    """Fetches details of a specific task."""
    task = coordinator.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")
    return task


@router.post("/tasks/{task_id}/start")
def start_task(task_id: str):
    """Dispatches a task for autonomous execution in a background worker thread."""
    res = coordinator.start_task_execution(task_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res


@router.post("/tasks/{task_id}/cancel")
def cancel_task(task_id: str):
    """Cancels a pending or running task."""
    return coordinator.cancel_task(task_id)


@router.post("/tasks/{task_id}/retry")
def retry_task(task_id: str):
    """Resets and retries a failed task."""
    return coordinator.retry_task(task_id)


@router.get("/tasks/{task_id}/logs")
def get_task_execution_logs(task_id: str):
    """Retrieves the step-by-step tool execution audit trail for a task."""
    logs = coordinator.get_task_logs(task_id)
    return {"task_id": task_id, "total_steps": len(logs), "logs": logs}


# -------------------------------------------------------------------------
# Inter-Agent & User Communication Endpoints
# -------------------------------------------------------------------------

@router.get("/messages")
def get_messages(
    sender: Optional[str] = Query(None),
    recipient: Optional[str] = Query(None),
    task_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Retrieves chat and inter-agent communication messages."""
    msgs = coordinator.get_messages(sender=sender, recipient=recipient, task_id=task_id, limit=limit, offset=offset)
    return {"messages": msgs, "count": len(msgs)}


@router.post("/messages")
def post_message(payload: SendMessageRequest):
    """Sends a new message between User, Bot A, and Bot B."""
    res = send_agent_message(
        sender=payload.sender,
        recipient=payload.recipient,
        content=payload.content,
        task_id=payload.task_id,
        message_type=payload.message_type,
    )
    return res


# -------------------------------------------------------------------------
# Reports & Deliverables Endpoints
# -------------------------------------------------------------------------

@router.get("/reports")
def list_reports(
    category: Optional[str] = Query(None, description="coa, ai_engineer, benchmarks"),
    agent_id: Optional[str] = Query(None, description="bot_a, bot_b"),
    limit: int = Query(50, ge=1, le=100),
):
    """Lists generated technical deliverables and architecture reports."""
    reports = coordinator.get_reports(category=category, agent_id=agent_id, limit=limit)
    return {"reports": reports, "count": len(reports)}


@router.get("/reports/{report_id}/content")
def get_report_content(report_id: int):
    """Fetches the full markdown content of a generated report file."""
    with coordinator.get_agents_status():
        pass

    from backend.agents.db_models import get_agent_db_connection
    with get_agent_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agent_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found.")

    rel_path = row["file_path"]
    full_path = BASE_DIR / rel_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"Report file '{rel_path}' does not exist on disk.")

    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "agent_id": row["agent_id"],
        "file_path": row["file_path"],
        "created_at": row["created_at"],
        "content": content,
    }
