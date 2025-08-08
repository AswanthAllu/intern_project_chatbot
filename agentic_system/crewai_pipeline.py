from __future__ import annotations

"""
CrewAI integration with graceful fallback to internal agents if CrewAI
is not installed in the Python environment.
"""

from typing import Any, Dict

from .task_planner_agent import TaskPlannerAgent
from .research_agent import ResearchAgent
from .reasoning_agent import ReasoningAgent
from .content_agent import ContentAgent
from .protocol import Task


def _fallback_pipeline(user_input: str) -> Dict[str, Any]:
    plan_res = TaskPlannerAgent().run(Task(id="t1", type="plan", input=user_input))
    research_res = ResearchAgent().run(Task(id="t2", type="research", input=user_input))
    reason_res = ReasoningAgent().run(Task(id="t3", type="reason", input=user_input, context=research_res.data))
    content_res = ContentAgent().run(Task(id="t4", type="content", input=user_input, context=reason_res.data))
    return {
        "mode": "fallback",
        "plan": plan_res.data.get("plan", []),
        "findings": research_res.data.get("findings"),
        "reasoning": reason_res.data.get("reasoning"),
        "answer": content_res.output,
        "followUps": content_res.data.get("followUps", []),
    }


def run_crewai_pipeline(user_input: str) -> Dict[str, Any]:
    try:
        # Lazy import so environments without CrewAI still work
        from crewai import Agent as CrewAgent, Task as CrewTask, Crew  # type: ignore
    except Exception:
        return _fallback_pipeline(user_input)

    # Minimal Crew setup using LLM-agnostic reasoning (no API keys required)
    planner = CrewAgent(
        role="Planner",
        goal="Break the user request into steps",
        backstory="You plan pragmatic steps for knowledge tasks.",
        allow_delegation=False,
    )
    researcher = CrewAgent(
        role="Researcher",
        goal="Gather concise facts",
        backstory="You extract key facts from known tools.",
        allow_delegation=False,
    )
    reasoner = CrewAgent(
        role="Reasoner",
        goal="Synthesize findings into a conclusion",
        backstory="You think step-by-step to reach a clear conclusion.",
        allow_delegation=False,
    )
    writer = CrewAgent(
        role="Writer",
        goal="Produce a clear answer and follow-ups",
        backstory="You communicate crisply.",
        allow_delegation=False,
    )

    t1 = CrewTask(description=f"Create a 3-step plan for: {user_input}", agent=planner, expected_output="A JSON array of steps")
    t2 = CrewTask(description=f"Provide 3-5 key facts about: {user_input}", agent=researcher, expected_output="A bullet list of facts")
    t3 = CrewTask(description="Summarize the facts into a short conclusion", agent=reasoner, expected_output="One paragraph conclusion")
    t4 = CrewTask(description="Write the final answer and 2 follow-up questions", agent=writer, expected_output="Answer text + follow-ups")

    crew = Crew(agents=[planner, researcher, reasoner, writer], tasks=[t1, t2, t3, t4])
    try:
        result = crew.kickoff()
        return {"mode": "crewai", "output": str(result)}
    except Exception:
        # If any issue occurs, fallback to internal agents
        return _fallback_pipeline(user_input)
