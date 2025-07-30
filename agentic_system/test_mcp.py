
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from agentic_system.mcp_controller import MCPController

if __name__ == "__main__":
    mcp = MCPController()
    user_input = "Generate a podcast and slide deck on the evolution of LLMs with references."
    result = mcp.run(user_input)
    print("MCP Output:\n", result)
