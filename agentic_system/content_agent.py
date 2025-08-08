from __future__ import annotations

from typing import Any, Dict, List

from .base_agent import BaseAgent
from .protocol import Task, Result


class ContentAgent(BaseAgent):
    name = "content"

    def handle(self, task: Task) -> Result:
        reasoning = (task.context or {}).get("reasoning", {})
        conclusion = reasoning.get("conclusion") or task.input

        answer = f"Answer: {conclusion}"
        followups: List[str] = [
            "Do you want me to search for more details?",
            "Should I provide examples or code snippets?",
        ]
        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output=answer)
        res.data = {"followUps": followups}
        return res
