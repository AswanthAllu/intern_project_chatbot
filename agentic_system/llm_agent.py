from __future__ import annotations

import os
import json
import urllib.request
from typing import Any, Dict

from .base_agent import BaseAgent
from .protocol import Task, Result


class LlmAgent(BaseAgent):
    name = "llm"

    def handle(self, task: Task) -> Result:
        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output="")
        api_base = os.getenv("NODE_SERVER_API_BASE", "http://127.0.0.1:5005")
        query = task.input.strip()
        
        # Check if we should use Ollama specifically
        use_ollama = task.context.get("use_ollama", False)
        model = task.context.get("model", "llama3.2:latest")
        
        try:
            if use_ollama:
                # Use Ollama agent endpoint
                req = urllib.request.Request(
                    f"{api_base}/api/agents/ollama",
                    data=json.dumps({"input": query, "model": model}).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
            else:
                # Use regular answer endpoint
                req = urllib.request.Request(
                    f"{api_base}/api/agents/answer",
                    data=json.dumps({"input": query}).encode("utf-8"),
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
                        "model": data.get("model"),
                        "metadata": data.get("metadata", {}),
                        "agent_type": "ollama" if use_ollama else "multi_llm"
                    }
                    return res
        except Exception as e:
            print(f"LlmAgent error: {e}")

        # Fallback if server is not reachable
        res.output = f"I'm unable to reach the AI service right now. Here's a brief answer: {query[:120]}..."
        return res
