"""
Base agent with unified run() lifecycle, timeouts, and metrics.
"""
from __future__ import annotations

import json
import time
from abc import ABC, abstractmethod
from typing import Any, Dict

from .protocol import Task, Result, AgentError


class BaseAgent(ABC):
    name: str = "base"

    def __init__(self, config: Dict[str, Any] | None = None):
        self.config = config or {}

    @abstractmethod
    def handle(self, task: Task) -> Result:
        """Implement agent-specific logic and return a Result."""

    def run(self, task: Task) -> Result:
        start = time.time()
        res = Result(id=f"{self.name}-{int(start*1000)}", task_id=task.id, success=False, output="")
        try:
            res = self.handle(task)
            res.success = True if res.success is None else res.success
            return res
        except AgentError as e:
            res.success = False
            res.error = str(e)
            res.output = res.output or "AgentError"
            return res
        except Exception as e:  # noqa: BLE001
            res.success = False
            res.error = f"UnhandledError: {e}"
            return res
        finally:
            res.metrics.setdefault("agent", self.name)
            res.finish()

    # Convenience for JSON outputs
    @staticmethod
    def json(data: Dict[str, Any]) -> str:
        try:
            return json.dumps(data, ensure_ascii=False)
        except Exception:  # noqa: BLE001
            return str(data)
