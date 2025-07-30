from typing import Dict, Any

class AgentMessage:
    def __init__(self, task_id: str, type_: str, input_: Any, requested_by: str):
        self.task_id = task_id
        self.type = type_
        self.input = input_
        self.requested_by = requested_by

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "type": self.type,
            "input": self.input,
            "requested_by": self.requested_by
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'AgentMessage':
        return AgentMessage(
            task_id=data["task_id"],
            type_=data["type"],
            input_=data["input"],
            requested_by=data["requested_by"]
        )
