Agentic System and MCP Server

Overview

- Production-grade minimal agents (plan, research, reason, execute, content)
- MCP-style controller with stdio protocol and HTTP shim
- Optional integration with Node server via HTTP

Run locally

1. StdIO MCP loop
   python -m agentic_system.mcp_controller --mode stdio

2. HTTP shim
   python -m agentic_system.mcp_controller --mode http --host 127.0.0.1 --port 8765

Environment

- NODE_SERVER_API_BASE=http://localhost:3000 # to let ResearchAgent call existing endpoints

HTTP API (shim)

- POST /pipeline { input }
- POST /agent/{name} { id, input, context, tools }
