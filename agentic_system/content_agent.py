
from .base_agent import BaseAgent
from .protocol import AgentMessage
from typing import Dict, Any
import requests

class ContentAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="ContentAgent")

    def handle_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        input_text = message.get("input", "")
        try:
            resp = requests.post("http://localhost:5007/api/services/generate-podcast", json={"content": input_text})
            data = resp.json()
            return {"result": data, "agent": self.name}
        except Exception as e:
            return {"error": str(e), "agent": self.name}
