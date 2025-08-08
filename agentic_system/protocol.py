"""
Protocol definitions for the agentic system: tasks, results, and error types.

Lightweight and dependency-free to keep import cost minimal.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import time


@dataclass
class ToolCall:
    name: str
    arguments: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Task:
    id: str
    type: str  # plan|research|reason|execute|content
    input: str
    context: Dict[str, Any] = field(default_factory=dict)
    tools: List[ToolCall] = field(default_factory=list)
    timeout_ms: int = 30000


@dataclass
class Result:
    id: str
    task_id: str
    success: bool
    output: str
    data: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    started_at: float = field(default_factory=lambda: time.time())
    finished_at: float = field(default_factory=lambda: time.time())

    def finish(self):
        self.finished_at = time.time()
        self.metrics.setdefault("duration_ms", int((self.finished_at - self.started_at) * 1000))


class AgentError(Exception):
    pass
