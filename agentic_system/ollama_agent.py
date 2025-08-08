from __future__ import annotations

import os
import json
import urllib.request
from typing import Any, Dict

from .base_agent import BaseAgent
from .protocol import Task, Result


class OllamaAgent(BaseAgent):
    name = "ollama"

    def handle(self, task: Task) -> Result:
        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output="")
        api_base = os.getenv("NODE_SERVER_API_BASE", "http://127.0.0.1:5005")
        query = task.input.strip()
        model = task.context.get("model", "llama3.2:latest")
        
        try:
            req = urllib.request.Request(
                f"{api_base}/api/agents/ollama",
                data=json.dumps({"input": query, "model": model}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            
            with urllib.request.urlopen(req, timeout=30) as resp:  # nosec
                payload = json.loads(resp.read().decode("utf-8"))
                if payload.get("success"):
                    data = payload.get("data") or {}
                    answer = data.get("answer") or data.get("response") or ""
                    res.output = answer
                    res.data = {
                        "model": data.get("model", model),
                        "metadata": data.get("metadata", {}),
                        "agent_type": "ollama"
                    }
                    return res
        except Exception as e:
            print(f"OllamaAgent error: {e}")

        # Fallback if Ollama is not available
        res.output = f"Ollama is not available. Here's a brief response: {query[:120]}..."
        res.data = {"model": model, "agent_type": "ollama", "error": "service_unavailable"}
        return res
