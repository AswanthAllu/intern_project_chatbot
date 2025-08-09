const express = require('express');
const AgentMcpClient = require('../services/agentMcpClient');

const router = express.Router();
const client = new AgentMcpClient({});
const IntelligentMultiLLM = require('../services/intelligentMultiLLM');
const OllamaConnector = require('../services/modelConnectors/ollamaConnector');

router.post('/pipeline', async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ success: false, error: 'input_required' });
        const result = await client.pipeline(input);
        const answer = (result && result.result && result.result.answer) || result.answer || '';
        res.json({ success: true, data: { answer } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/agent/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await client.agent(name, req.body || {});
        res.json({ success: true, data: result.result || result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/pipeline/crewai', async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ success: false, error: 'input_required' });
        const axios = require('axios');
        const base = process.env.MCP_HTTP_BASE || 'http://127.0.0.1:8765';
        const { data } = await axios.post(`${base}/pipeline/crewai`, { input });
        const answer = (data && data.result && data.result.answer) || data.answer || '';
        res.json({ success: true, data: { answer } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Ollama-powered agent endpoint
router.post('/ollama', async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ success: false, error: 'input_required' });

        // Get user's Ollama URL from request headers or use default
        const userOllamaUrl = req.headers['x-ollama-url'] || process.env.OLLAMA_URL || 'http://localhost:11434';

        const ollama = new OllamaConnector(userOllamaUrl);
        await ollama.initialize();

        if (!ollama.isAvailable) {
            throw new Error('Ollama is not available at ' + userOllamaUrl);
        }

        // Use llama3.1 as default, or get from request
        const model = req.body.model || 'llama3.1:latest';
        const result = await ollama.generateChatResponse(input, model, {
            temperature: 0.7,
            max_tokens: 2048
        });

        res.json({
            success: true,
            data: {
                answer: result.response,
                model: result.model,
                metadata: { ollama_url: userOllamaUrl }
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// MCP-powered search endpoint that integrates with normal chat
router.post('/search', async (req, res) => {
    try {
        const { input, history = [], sessionId = '', systemPrompt = '' } = req.body;
        if (!input) return res.status(400).json({ success: false, error: 'input_required' });

        // Check if MCP service is available
        try {
            // Use MCP pipeline for enhanced search
            const result = await client.pipeline(input);
            const answer = (result && result.result && result.result.answer) || result.answer || '';

            // Format as normal chat response
            res.json({
                success: true,
                data: {
                    response: answer,
                    metadata: {
                        searchType: 'mcp_powered',
                        agentUsed: true,
                        model: 'mcp-pipeline'
                    }
                }
            });
        } catch (mcpError) {
            // MCP service unavailable - return helpful error
            console.log('MCP service unavailable:', mcpError.message);

            // Check if it's a proxy error or connection error
            if (mcpError.message.includes('Proxy error') || mcpError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'MCP service is currently unavailable. The AI agent service may not be running.',
                    details: 'Please check if the MCP HTTP service is running on port 8765.',
                    suggestedAction: 'disable_mcp'
                });
            }

            // Other MCP errors
            return res.status(500).json({
                success: false,
                error: `MCP service error: ${mcpError.message}`,
                suggestedAction: 'disable_mcp'
            });
        }
    } catch (e) {
        console.error('MCP search endpoint error:', e);
        res.status(500).json({
            success: false,
            error: 'Internal server error in MCP search',
            details: e.message
        });
    }
});

module.exports = router;

// Minimal final-answer endpoint leveraging existing multi-LLM logic
// Returns only final answer and the model used (no internal process details)
router.post('/answer', async (req, res) => {
    try {
        const { input } = req.body || {};
        if (!input || typeof input !== 'string') {
            return res.status(400).json({ success: false, error: 'input_required' });
        }

        const ml = new IntelligentMultiLLM();
        const result = await ml.generateResponse(input, [], {});
        const answer = result?.response || '';
        const model = result?.model || result?.modelUsed || 'auto';

        return res.json({ success: true, data: { answer, model, metadata: {} } });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});
