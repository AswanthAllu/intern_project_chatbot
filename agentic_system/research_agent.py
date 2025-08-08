from __future__ import annotations

import os
import json
import urllib.request
from typing import Any, Dict

from .base_agent import BaseAgent
from .protocol import Task, Result


class ResearchAgent(BaseAgent):
    name = "research"

    def _http_get(self, url: str, timeout: int = 10) -> Dict[str, Any] | None:
        try:
            with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec - controlled URL
                data = resp.read().decode("utf-8")
                return json.loads(data)
        except Exception:
            return None

    def handle(self, task: Task) -> Result:
        res = Result(id=f"{self.name}-{task.id}", task_id=task.id, success=True, output="")

        # If server exposes deep-search, use it
        api_base = os.getenv("NODE_SERVER_API_BASE", "http://127.0.0.1:5007")
        query = task.input.strip()
        findings: Dict[str, Any] = {"query": query, "sources": [], "summary": ""}

        # Try multi-model first if provided
        multi_url = f"{api_base}/api/multi-model/query?light=true"
        try:
            req = urllib.request.Request(
                multi_url,
                data=json.dumps({"query": query}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as resp:  # nosec - controlled URL
                payload = json.loads(resp.read().decode("utf-8"))
                if payload.get("success"):
                    data = payload.get("data") or {}
                    findings["summary"] = data.get("message") or data.get("response") or ""
        except Exception:
            pass

        if not findings["summary"]:
            findings["summary"] = f"No remote research available. Heuristic answer for: {query[:80]}"

        res.data = {"findings": findings}
        res.output = self.json(findings)
        return res
