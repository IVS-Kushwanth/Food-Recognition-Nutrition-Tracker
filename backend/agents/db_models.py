"""
Database models and connection manager for the Autonomous Agent System.
Stores agent states, tasks, inter-agent messages, execution logs, and reports.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.config import AGENT_DB_PATH


def get_agent_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection for the agent management database with row factory."""
    conn = sqlite3.connect(str(AGENT_DB_PATH), check_same_thread=False, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_agent_db():
    """Initializes the database schema and seeds initial agent profiles."""
    with get_agent_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Agents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT DEFAULT 'idle',
                current_task_id TEXT,
                total_tasks_completed INTEGER DEFAULT 0,
                total_tasks_failed INTEGER DEFAULT 0,
                last_active_at TEXT,
                system_metrics TEXT
            )
        """)

        # 2. Agent Tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                assigned_to TEXT NOT NULL, -- 'bot_a', 'bot_b', 'collaborative'
                priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
                status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
                dependencies TEXT, -- JSON array of task IDs
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                result_summary TEXT,
                deliverables TEXT, -- JSON array of file paths / titles
                error_message TEXT
            )
        """)

        # 3. Agent Messages table (Inter-agent & User communication)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT NOT NULL, -- 'user', 'bot_a', 'bot_b', 'system'
                recipient TEXT NOT NULL, -- 'user', 'bot_a', 'bot_b', 'all'
                task_id TEXT,
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'chat', -- 'chat', 'task_assignment', 'benchmark_request', 'benchmark_data', 'status_update', 'review_request'
                timestamp TEXT NOT NULL,
                metadata TEXT
            )
        """)

        # 4. Agent Execution Logs (Audit trail of every tool call and observation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                step_number INTEGER NOT NULL,
                phase TEXT NOT NULL, -- 'PLAN', 'ASSIGN', 'EXECUTE', 'OBSERVE', 'DEBUG', 'VERIFY', 'REPORT'
                action TEXT NOT NULL,
                tool_name TEXT,
                tool_input TEXT,
                tool_output TEXT,
                status TEXT DEFAULT 'success', -- 'success', 'warning', 'error'
                timestamp TEXT NOT NULL
            )
        """)

        # 5. Agent Reports table (Generated deliverable tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                agent_id TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                file_path TEXT NOT NULL,
                summary TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Seed initial bot profiles if not existing
        cursor.execute("SELECT id FROM agents WHERE id = 'bot_a'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO agents (id, name, role, status, last_active_at, system_metrics)
                VALUES (
                    'bot_a',
                    'Bot A – COA Researcher',
                    'Computer Organization and Architecture Research Specialist',
                    'idle',
                    ?,
                    ?
                )
            """, (datetime.now(timezone.utc).isoformat(), json.dumps({"specialty": "CPU Registers, ALU, Memory Hierarchy, LRU Caching, RAM Residency"})))

        cursor.execute("SELECT id FROM agents WHERE id = 'bot_b'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO agents (id, name, role, status, last_active_at, system_metrics)
                VALUES (
                    'bot_b',
                    'Bot B – AI Engineer',
                    'Machine Learning and Software Implementation Specialist',
                    'idle',
                    ?,
                    ?
                )
            """, (datetime.now(timezone.utc).isoformat(), json.dumps({"specialty": "Model Inference, Benchmarking, PyTorch Optimization, Bug Fixing, Testing"})))

        conn.commit()


# Initialize on import
init_agent_db()
