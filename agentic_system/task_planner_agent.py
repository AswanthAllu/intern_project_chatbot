
from .base_agent import BaseAgent
from .protocol import AgentMessage
from typing import Dict, Any, List
import uuid
import requests

class TaskPlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="TaskPlannerAgent")

    def decompose_task(self, user_input: str) -> List[Dict[str, Any]]:
        try:
            resp = requests.post("http://localhost:5007/api/services/decompose", json={"query": user_input})
            data = resp.json()
            decomposition = data.get("decomposition", [])
            # Map backend decomposition to agentic subtasks
            subtasks = []
            for sub in decomposition:
                subtasks.append({
                    "type": sub.get("type", "research"),
                    "input": sub.get("input", user_input),
                    "requested_by": self.name
                })
            if not subtasks:
                subtasks = [
                    {"type": "research", "input": user_input, "requested_by": self.name},
                    {"type": "reasoning", "input": user_input, "requested_by": self.name},
                    {"type": "content", "input": user_input, "requested_by": self.name}
                ]
            return subtasks
        except Exception:
            return [
                {"type": "research", "input": user_input, "requested_by": self.name},
                {"type": "reasoning", "input": user_input, "requested_by": self.name},
                {"type": "content", "input": user_input, "requested_by": self.name}
            ]

    def handle_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        user_input = message.get("input", "")
        subtasks = self.decompose_task(user_input)
        task_msgs = [
            AgentMessage(
                task_id=str(uuid.uuid4()),
                type_=sub["type"],
                input_=sub["input"],
                requested_by=sub["requested_by"]
            ).to_dict() for sub in subtasks
        ]
        return {"subtasks": task_msgs}
