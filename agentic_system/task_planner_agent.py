from __future__ import annotations

from typing import Any, Dict, List

from .base_agent import BaseAgent
from .protocol import Task, Result


class TaskPlannerAgent(BaseAgent):
    name = "task-planner"

    def handle(self, task: Task) -> Result:
        # Very simple plan decomposition as a placeholder
        steps: List[Dict[str, Any]] = [
            {"id": "research", "type": "research", "desc": "Collect facts and references"},
            {"id": "reason", "type": "reason", "desc": "Analyze and derive conclusions"},
            {"id": "content", "type": "content", "desc": "Draft final answer"},
        ]
        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output="")
        res.data = {"plan": steps}
        res.output = self.json({"plan": steps})
        return res
