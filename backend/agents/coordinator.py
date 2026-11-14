"""
Central Agent Coordinator and Task Scheduler.
Orchestrates autonomous execution of Bot A (COA Researcher) and Bot B (AI Engineer),
manages collaborative workflows, task dependencies, background threads, and inter-agent messages.
"""

import json
import uuid
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.agents.db_models import get_agent_db_connection
from backend.agents.bot_a_coa import BotACOAResearcher
from backend.agents.bot_b_engineer import BotBAIEngineer
from backend.agents.tools import measure_hardware_metrics, send_agent_message


class AgentCoordinator:
    """Singleton Coordinator managing autonomous agents, task queues, and background threads."""

    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.bot_a = BotACOAResearcher()
        self.bot_b = BotBAIEngineer()
        self.running_threads: Dict[str, threading.Thread] = {}

    @classmethod
    def get_instance(cls) -> "AgentCoordinator":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    # -------------------------------------------------------------------------
    # Task Management Operations
    # -------------------------------------------------------------------------

    def create_task(
        self,
        title: str,
        description: str,
        assigned_to: str = "bot_a",  # 'bot_a', 'bot_b', 'collaborative'
        priority: str = "medium",    # 'low', 'medium', 'high', 'critical'
        dependencies: Optional[List[str]] = None,
        auto_start: bool = True,
    ) -> Dict[str, Any]:
        """Creates a new task in the database and optionally triggers immediate execution."""
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        deps_json = json.dumps(dependencies) if dependencies else None

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO agent_tasks (
                    id, title, description, assigned_to, priority,
                    status, dependencies, created_at
                )
                VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
            """, (task_id, title, description, assigned_to, priority, deps_json, now_iso))
            conn.commit()

        # Send initial notification message
        send_agent_message(
            sender="system",
            recipient=assigned_to,
            task_id=task_id,
            message_type="task_assignment",
            content=f"New task assigned [{priority.upper()}]: '{title}' -> {assigned_to.upper()}",
        )

        task_data = self.get_task_by_id(task_id)

        if auto_start:
            self.start_task_execution(task_id)

        return task_data

    def start_task_execution(self, task_id: str) -> Dict[str, Any]:
        """Starts asynchronous task execution in a dedicated background worker thread."""
        task = self.get_task_by_id(task_id)
        if not task:
            return {"status": "error", "message": f"Task '{task_id}' not found."}

        if task["status"] == "in_progress":
            return {"status": "warning", "message": f"Task '{task_id}' is already executing."}

        # Check dependencies
        if task.get("dependencies"):
            try:
                deps = json.loads(task["dependencies"])
                for dep_id in deps:
                    dep_task = self.get_task_by_id(dep_id)
                    if not dep_task or dep_task["status"] != "completed":
                        return {
                            "status": "error",
                            "message": f"Cannot start task '{task_id}': Dependency '{dep_id}' is not yet completed.",
                        }
            except Exception:
                pass

        # Spawn background thread
        thread = threading.Thread(
            target=self._execute_task_worker,
            args=(task,),
            daemon=True,
            name=f"Worker-{task_id}",
        )
        self.running_threads[task_id] = thread
        thread.start()

        return {"status": "started", "task_id": task_id, "thread_name": thread.name}

    def _execute_task_worker(self, task: Dict[str, Any]):
        """Target worker function executing the task lifecycle."""
        task_id = task["id"]
        assigned_to = task["assigned_to"]

        try:
            if assigned_to == "bot_a":
                self.bot_a.execute_task(task)
            elif assigned_to == "bot_b":
                self.bot_b.execute_task(task)
            elif assigned_to in ("collaborative", "both"):
                # Collaborative Workflow: Bot B gathers empirical data, Bot A synthesizes COA report
                self._execute_collaborative_workflow(task)
            else:
                self.bot_a.execute_task(task)
        finally:
            self.running_threads.pop(task_id, None)

    def _execute_collaborative_workflow(self, task: Dict[str, Any]):
        """Coordinated workflow combining Bot B's engineering benchmarks with Bot A's COA synthesis."""
        task_id = task["id"]
        title = task["title"]

        # Step 1: Bot B runs ML and hardware measurements
        b_res = self.bot_b.execute_task({
            "id": task_id,
            "title": f"[Engineering Phase] {title}",
            "description": f"Gather empirical hardware, ML inference, and cache benchmarks for collaborative task '{title}'.",
        })

        # Step 2: Bot A uses findings to produce COA documentation
        a_res = self.bot_a.execute_task({
            "id": task_id,
            "title": f"[COA Architecture Phase] {title}",
            "description": f"Synthesize comprehensive COA memory hierarchy report incorporating Bot B's verified telemetry.",
        })

        # Consolidate deliverables
        combined_deliverables = (b_res.get("deliverables") or []) + (a_res.get("deliverables") or [])
        summary = (
            f"Collaborative Task Complete. Bot B executed real hardware/inference benchmarks. "
            f"Bot A integrated the empirical findings into the COA architecture report. "
            f"Deliverables: {', '.join(combined_deliverables)}"
        )

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE agent_tasks
                SET status = 'completed',
                    completed_at = ?,
                    result_summary = ?,
                    deliverables = ?
                WHERE id = ?
            """, (
                datetime.now(timezone.utc).isoformat(),
                summary,
                json.dumps(combined_deliverables),
                task_id,
            ))
            conn.commit()

    def cancel_task(self, task_id: str) -> Dict[str, Any]:
        """Marks a pending or running task as cancelled."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE agent_tasks
                SET status = 'cancelled', completed_at = ?
                WHERE id = ?
            """, (datetime.now(timezone.utc).isoformat(), task_id))
            conn.commit()
        return {"status": "cancelled", "task_id": task_id}

    def retry_task(self, task_id: str) -> Dict[str, Any]:
        """Resets and re-starts a failed or cancelled task."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE agent_tasks
                SET status = 'pending', error_message = NULL, result_summary = NULL
                WHERE id = ?
            """, (task_id,))
            conn.commit()
        return self.start_task_execution(task_id)

    # -------------------------------------------------------------------------
    # Query & Telemetry Operations
    # -------------------------------------------------------------------------

    def get_agents_status(self) -> Dict[str, Any]:
        """Returns live statuses, task statistics, and system hardware telemetry."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents")
            agents_rows = cursor.fetchall()

            agents = []
            for r in agents_rows:
                agents.append({
                    "id": r["id"],
                    "name": r["name"],
                    "role": r["role"],
                    "status": r["status"],
                    "current_task_id": r["current_task_id"],
                    "total_tasks_completed": r["total_tasks_completed"],
                    "total_tasks_failed": r["total_tasks_failed"],
                    "last_active_at": r["last_active_at"],
                    "system_metrics": json.loads(r["system_metrics"]) if r["system_metrics"] else {},
                })

            # Task counts
            cursor.execute("SELECT status, COUNT(*) as cnt FROM agent_tasks GROUP BY status")
            counts = {row["status"]: row["cnt"] for row in cursor.fetchall()}

        hw = measure_hardware_metrics()

        return {
            "agents": agents,
            "counts": {
                "pending": counts.get("pending", 0),
                "in_progress": counts.get("in_progress", 0),
                "completed": counts.get("completed", 0),
                "failed": counts.get("failed", 0),
                "cancelled": counts.get("cancelled", 0),
                "total": sum(counts.values()),
            },
            "system_hardware": hw,
        }

    def get_tasks(
        self,
        status: Optional[str] = None,
        assigned_to: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Queries tasks with optional status and assignment filters."""
        query = "SELECT * FROM agent_tasks WHERE 1=1"
        params = []
        if isinstance(status, str) and status:
            query += " AND status = ?"
            params.append(status)
        if isinstance(assigned_to, str) and assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 50, int(offset) if isinstance(offset, (int, str)) and str(offset).isdigit() else 0])

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "title": r["title"],
                "description": r["description"],
                "assigned_to": r["assigned_to"],
                "priority": r["priority"],
                "status": r["status"],
                "dependencies": json.loads(r["dependencies"]) if r["dependencies"] else [],
                "created_at": r["created_at"],
                "started_at": r["started_at"],
                "completed_at": r["completed_at"],
                "result_summary": r["result_summary"],
                "deliverables": json.loads(r["deliverables"]) if r["deliverables"] else [],
                "error_message": r["error_message"],
            })
        return results

    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a single task by ID."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agent_tasks WHERE id = ?", (task_id,))
            r = cursor.fetchone()
        if not r:
            return None
        return {
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "assigned_to": r["assigned_to"],
            "priority": r["priority"],
            "status": r["status"],
            "dependencies": json.loads(r["dependencies"]) if r["dependencies"] else [],
            "created_at": r["created_at"],
            "started_at": r["started_at"],
            "completed_at": r["completed_at"],
            "result_summary": r["result_summary"],
            "deliverables": json.loads(r["deliverables"]) if r["deliverables"] else [],
            "error_message": r["error_message"],
        }

    def get_task_logs(self, task_id: str) -> List[Dict[str, Any]]:
        """Fetches the step-by-step execution log of a specific task."""
        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM agent_execution_logs
                WHERE task_id = ?
                ORDER BY step_number ASC, id ASC
            """, (task_id,))
            rows = cursor.fetchall()

        logs = []
        for r in rows:
            logs.append({
                "id": r["id"],
                "task_id": r["task_id"],
                "agent_id": r["agent_id"],
                "step_number": r["step_number"],
                "phase": r["phase"],
                "action": r["action"],
                "tool_name": r["tool_name"],
                "tool_input": json.loads(r["tool_input"]) if r["tool_input"] else None,
                "tool_output": json.loads(r["tool_output"]) if r["tool_output"] else None,
                "status": r["status"],
                "timestamp": r["timestamp"],
            })
        return logs

    def get_messages(
        self,
        sender: Optional[str] = None,
        recipient: Optional[str] = None,
        task_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Queries inter-agent and user messages."""
        query = "SELECT * FROM agent_messages WHERE 1=1"
        params = []
        if isinstance(sender, str) and sender:
            query += " AND sender = ?"
            params.append(sender)
        if isinstance(recipient, str) and recipient:
            query += " AND (recipient = ? OR recipient = 'all')"
            params.append(recipient)
        if isinstance(task_id, str) and task_id:
            query += " AND task_id = ?"
            params.append(task_id)
        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 100, int(offset) if isinstance(offset, (int, str)) and str(offset).isdigit() else 0])

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

        messages = []
        for r in reversed(rows):  # Return chronological order
            messages.append({
                "id": r["id"],
                "sender": r["sender"],
                "recipient": r["recipient"],
                "task_id": r["task_id"],
                "content": r["content"],
                "message_type": r["message_type"],
                "timestamp": r["timestamp"],
                "metadata": json.loads(r["metadata"]) if r["metadata"] else None,
            })
        return messages

    def get_reports(
        self,
        category: Optional[str] = None,
        agent_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Fetches list of generated reports and deliverables."""
        query = "SELECT * FROM agent_reports WHERE 1=1"
        params = []
        if isinstance(category, str) and category:
            query += " AND category = ?"
            params.append(category)
        if isinstance(agent_id, str) and agent_id:
            query += " AND agent_id = ?"
            params.append(agent_id)
        query += " ORDER BY id DESC LIMIT ?"
        params.append(int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 50)

        with get_agent_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

        reports = []
        for r in rows:
            reports.append({
                "id": r["id"],
                "task_id": r["task_id"],
                "agent_id": r["agent_id"],
                "title": r["title"],
                "category": r["category"],
                "file_path": r["file_path"],
                "summary": r["summary"],
                "created_at": r["created_at"],
            })
        return reports
