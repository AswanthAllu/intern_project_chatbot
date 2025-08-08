/**
 * Lightweight client to call the Python MCP HTTP shim.
 */
const axios = require('axios');

class AgentMcpClient {
    /**
     * @param {object} opts
     * @param {string} opts.baseUrl e.g. http://127.0.0.1:8765
     */
    constructor({ baseUrl } = {}) {
        this.baseUrl = baseUrl || process.env.MCP_HTTP_BASE || 'http://127.0.0.1:8765';
    }

    async pipeline(input) {
        const { data } = await axios.post(`${this.baseUrl}/pipeline`, { input });
        return data;
    }

    async agent(name, payload) {
        const { data } = await axios.post(`${this.baseUrl}/agent/${encodeURIComponent(name)}`, payload || {});
        return data;
    }
}

module.exports = AgentMcpClient;
