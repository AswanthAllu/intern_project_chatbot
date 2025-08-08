from __future__ import annotations

from typing import Any, Dict

from .base_agent import BaseAgent
from .protocol import Task, Result


class ExecutionAgent(BaseAgent):
    name = "execution"

    def handle(self, task: Task) -> Result:
        # Minimal execution of declared tools in task.tools (purely illustrative)
        out: Dict[str, Any] = {"executed": []}
        for call in task.tools:
            # Only allow a whitelist of tool names here
            if call.name in {"echo"}:
                out["executed"].append({"name": call.name, "result": call.arguments.get("text", "")})
            else:
                out["executed"].append({"name": call.name, "error": "tool_not_allowed"})

        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output=self.json(out))
        res.data = out
        return res
