const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class AgentMcpSpawner {
    constructor() {
        this.proc = null;
        this.baseUrl = process.env.MCP_HTTP_BASE || 'http://127.0.0.1:8765';
    }

    async start() {
        if (this.proc) return;
        const python = process.env.PYTHON || 'python';
        // Ensure Python can import the top-level agentic_system package
        const repoRoot = path.resolve(__dirname, '..', '..');
        this.proc = spawn(python, ['-m', 'agentic_system.mcp_controller', '--mode', 'http', '--host', '127.0.0.1', '--port', '8765'], {
            cwd: repoRoot,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        this.proc.stdout.on('data', (d) => console.log(`[MCP] ${d.toString().trim()}`));
        this.proc.stderr.on('data', (d) => console.warn(`[MCP:err] ${d.toString().trim()}`));
        await this.waitReady(15000);
    }

    async waitReady(timeoutMs = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                const { data } = await axios.get(`${this.baseUrl}/health`);
                if (data && data.ok) return true;
            } catch (_) { }
            await new Promise((r) => setTimeout(r, 300));
        }
        throw new Error('MCP server not ready');
    }

    async stop() {
        if (!this.proc) return;
        this.proc.kill('SIGTERM');
        this.proc = null;
    }
}

module.exports = new AgentMcpSpawner();
