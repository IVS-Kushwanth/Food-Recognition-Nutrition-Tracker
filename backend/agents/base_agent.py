"""
Base Agent Architecture with Autonomous Execution Loop:
PLAN -> ASSIGN -> EXECUTE -> OBSERVE -> DEBUG -> VERIFY -> REPORT.
Every step logs its actions and observations to SQLite for transparency and auditing.
"""

import json
import traceback
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from backend.agents.db_models import get_agent_db_connection
from backend.agents.tools import send_agent_message


class BaseAgent:
    """Abstract Base Class for autonomous tool-using agents."""

    def __init__(self, agent_id: str, name: str, role: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.step_counter = 0

    def log_execution_step(
        self,
        task_id: str,
        phase: str,
        action: str,
        tool_name: Optional[str] = None,
        tool_input: Optional[Any] = None,
        tool_output: Optional[Any] = None,
        status: str = "success",
    ):
        """Records an execution step into the agent_execution_logs audit table."""
        self.step_counter += 1
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO agent_execution_logs (
                    task_id, agent_id, step_number, phase, action,
                    tool_name, tool_input, tool_output, status, timestamp
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id,
                self.agent_id,
                self.step_counter,
                phase,
                action,
                tool_name,
                json.dumps(tool_input) if tool_input is not None else None,
                json.dumps(tool_output) if tool_output is not None else None,
                status,
                datetime.now(timezone.utc).isoformat(),
            ))
            conn.commit()

    def update_agent_status(self, status: str, current_task_id: Optional[str] = None):
        """Updates the agent's live status in the database."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE agents
                SET status = ?, current_task_id = ?, last_active_at = ?
                WHERE id = ?
            """, (status, current_task_id, datetime.now(timezone.utc).isoformat(), self.agent_id))
            conn.commit()

    def update_task_progress(
        self,
        task_id: str,
        status: str,
        result_summary: Optional[str] = None,
        deliverables: Optional[List[str]] = None,
        error_message: Optional[str] = None,
    ):
        """Updates task state, timestamps, deliverables, and summaries in the database."""
        now_iso = datetime.now(timezone.utc).isoformat()
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            if status == "in_progress":
                cursor.execute("""
                    UPDATE agent_tasks
                    SET status = ?, started_at = ?
                    WHERE id = ?
                """, (status, now_iso, task_id))
            elif status in ("completed", "failed", "cancelled"):
                cursor.execute("""
                    UPDATE agent_tasks
                    SET status = ?, completed_at = ?, result_summary = ?, deliverables = ?, error_message = ?
                    WHERE id = ?
                """, (
                    status,
                    now_iso,
                    result_summary,
                    json.dumps(deliverables) if deliverables else None,
                    error_message,
                    task_id,
                ))

                # Increment agent completion/failure counter
                col = "total_tasks_completed" if status == "completed" else "total_tasks_failed"
                cursor.execute(f"""
                    UPDATE agents
                    SET {col} = {col} + 1, status = 'idle', current_task_id = NULL
                    WHERE id = ?
                """, (self.agent_id,))
            conn.commit()

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the autonomous loop:
        PLAN -> ASSIGN -> EXECUTE -> OBSERVE -> DEBUG -> VERIFY -> REPORT.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement execute_task")
