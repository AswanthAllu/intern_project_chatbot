from __future__ import annotations

from typing import Any, Dict

from .base_agent import BaseAgent
from .protocol import Task, Result


class ReasoningAgent(BaseAgent):
    name = "reasoning"

    def handle(self, task: Task) -> Result:
        # Combine research findings and derive a concise conclusion
        context = task.context or {}
        findings = (context.get("findings") or {}).get("summary", "")
        conclusion = f"Based on research: {findings[:256]}"

        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output=conclusion)
        res.data = {
            "reasoning": {
                "assumptions": [],
                "steps": [
                    "Parse findings",
                    "Identify key points",
                    "Formulate conclusion",
                ],
                "conclusion": conclusion,
            }
        }
        return res
