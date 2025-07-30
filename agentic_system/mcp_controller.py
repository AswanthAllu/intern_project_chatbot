from .task_planner_agent import TaskPlannerAgent
from .research_agent import ResearchAgent
from .reasoning_agent import ReasoningAgent
from .content_agent import ContentAgent
from .execution_agent import ExecutionAgent
from .protocol import AgentMessage
from typing import Dict, Any, List
import time

class MCPController:
    def __init__(self):
        self.task_planner = TaskPlannerAgent()
        self.research_agent = ResearchAgent()
        self.reasoning_agent = ReasoningAgent()
        self.content_agent = ContentAgent()
        self.execution_agent = ExecutionAgent()
        self.agent_map = {
            "research": self.research_agent,
            "reasoning": self.reasoning_agent,
            "content": self.content_agent,
            "execution": self.execution_agent
        }

    def run(self, user_input: str) -> Dict[str, Any]:
        # Step 1: Planner decomposes the task
        planner_msg = {"input": user_input}
        subtasks = self.task_planner.handle_task(planner_msg)["subtasks"]
        results = []
        for subtask in subtasks:
            agent_type = subtask["type"]
            agent = self.agent_map.get(agent_type)
            if not agent:
                results.append({"error": f"No agent for type {agent_type}"})
                continue
            # Retry logic
            for attempt in range(2):
                try:
                    result = agent.handle_task(subtask)
                    results.append(result)
                    break
                except Exception as e:
                    if attempt == 1:
                        results.append({"error": str(e), "agent": agent_type})
                    else:
                        time.sleep(0.5)
        # Optionally, pass results to execution agent
        exec_result = self.execution_agent.handle_task({"input": str(results)})
        return {"results": results, "execution": exec_result}
