const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// POST /api/agentic-task
router.post('/', async (req, res) => {
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }
    // Path to Python script
    const scriptPath = path.join(__dirname, '../../agentic_system/test_mcp.py');
    // Spawn Python process
    const py = spawn('python', [scriptPath], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    let error = '';
    py.stdout.on('data', (data) => { output += data.toString(); });
    py.stderr.on('data', (data) => { error += data.toString(); });
    py.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: error || 'Python error', code });
        }
        // Try to extract JSON from output
        let result = output;
        try {
            // Find JSON-like object in output
            const match = result.match(/\{[\s\S]*\}/);
            if (match) result = JSON.parse(match[0]);
        } catch (e) { }
        res.json({ result });
    });
    // Send user prompt to Python via stdin if needed (not used here)
});

module.exports = router;
