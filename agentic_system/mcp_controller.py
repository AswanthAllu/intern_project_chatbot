from __future__ import annotations

"""
Minimal MCP-style controller exposing agents via:
...
"""

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict

from .protocol import Task, ToolCall
from .task_planner_agent import TaskPlannerAgent
from .research_agent import ResearchAgent
from .reasoning_agent import ReasoningAgent
from .execution_agent import ExecutionAgent
from .content_agent import ContentAgent
from .crewai_pipeline import run_crewai_pipeline
from .llm_agent import LlmAgent
from .ollama_agent import OllamaAgent


AGENTS = {
	"plan": TaskPlannerAgent(),
	"research": ResearchAgent(),
	"reason": ReasoningAgent(),
	"execute": ExecutionAgent(),
	"content": ContentAgent(),
	"llm": LlmAgent(),
	"ollama": OllamaAgent(),
}


def run_pipeline(user_input: str) -> Dict[str, Any]:
	# Use LLM agent to get a single final answer without exposing internal steps
	llm_res = AGENTS["llm"].run(Task(id="t-final", type="llm", input=user_input))
	return {"answer": llm_res.output}


# --- STDIO protocol (very simple JSON-RPC-ish) ---
def stdio_loop():
	for line in sys.stdin:
		line = line.strip()
		if not line:
			continue
		try:
			req = json.loads(line)
			cmd = req.get("cmd")
			if cmd == "pipeline":
				user_input = req.get("input", "")
				result = run_pipeline(user_input)
				sys.stdout.write(json.dumps({"ok": True, "result": result}) + "\n")
				sys.stdout.flush()
			elif cmd == "agent":
				agent = req.get("agent")
				agent_task = Task(
					id=req.get("id", "t"),
					type=agent,
					input=req.get("input", ""),
					context=req.get("context", {}),
					tools=[ToolCall(**tc) for tc in req.get("tools", [])],
				)
				handler = AGENTS.get(agent)
				if not handler:
					raise ValueError(f"unknown_agent:{agent}")
				res = handler.run(agent_task)
				sys.stdout.write(json.dumps({"ok": True, "result": res.__dict__}) + "\n")
				sys.stdout.flush()
			else:
				raise ValueError("unknown_command")
		except Exception as e:  # noqa: BLE001
			sys.stdout.write(json.dumps({"ok": False, "error": str(e)}) + "\n")
			sys.stdout.flush()


# --- HTTP shim for Node integration ---
class Handler(BaseHTTPRequestHandler):
	def _json(self, status: int, data: Dict[str, Any]):
		self.send_response(status)
		self.send_header("Content-Type", "application/json")
		self.end_headers()
		self.wfile.write(json.dumps(data).encode("utf-8"))

	def do_GET(self):  # noqa: N802
		if self.path == "/health":
			return self._json(200, {"ok": True, "status": "ready"})
		return self._json(404, {"ok": False, "error": "not_found"})

	def do_POST(self):  # noqa: N802
		try:
			length = int(self.headers.get("Content-Length", 0))
			body = self.rfile.read(length).decode("utf-8") if length else "{}"
			req = json.loads(body)
		except Exception:
			return self._json(400, {"ok": False, "error": "invalid_json"})

		if self.path == "/pipeline":
			result = run_pipeline(req.get("input", ""))
			return self._json(200, {"ok": True, "result": result})

		if self.path == "/pipeline/crewai":
			result = run_crewai_pipeline(req.get("input", ""))
			return self._json(200, {"ok": True, "result": result})

		if self.path.startswith("/agent/"):
			agent = self.path.split("/agent/")[-1]
			handler = AGENTS.get(agent)
			if not handler:
				return self._json(404, {"ok": False, "error": "unknown_agent"})
			task = Task(
				id=req.get("id", "t"),
				type=agent,
				input=req.get("input", ""),
				context=req.get("context", {}),
				tools=[ToolCall(**tc) for tc in req.get("tools", [])],
			)
			res = handler.run(task)
			return self._json(200, {"ok": True, "result": res.__dict__})

		return self._json(404, {"ok": False, "error": "not_found"})


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("--mode", choices=["stdio", "http"], default="stdio")
	parser.add_argument("--host", default="127.0.0.1")
	parser.add_argument("--port", type=int, default=8765)
	args = parser.parse_args()

	if args.mode == "stdio":
		stdio_loop()
	else:
		httpd = HTTPServer((args.host, args.port), Handler)
		print(f"MCP HTTP server listening on http://{args.host}:{args.port}")
		httpd.serve_forever()


if __name__ == "__main__":
	main()
