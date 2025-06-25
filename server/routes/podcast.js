// server/routes/podcast.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { decrypt } = require('../services/encryptionService');
const { determineFileTypeSubfolder } = require('../utils/fileUtils');

const router = express.Router();
const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_CORE_SERVICE_URL;

const sanitizeForPath = (name) => name.replace(/[^a-zA-Z0-9_-]/g, '_');

// POST /api/podcast/generate
router.post('/generate', async (req, res) => {
    const { serverFilename, documentName } = req.body;
    const userId = req.user._id.toString();
    const sanitizedUsername = sanitizeForPath(req.user.username || 'unknown_user');

    if (!serverFilename || !documentName) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (!PYTHON_AI_SERVICE_URL) {
        return res.status(503).json({ message: "AI Service is unavailable." });
    }

    try {
        const user = await User.findById(userId).select('+geminiApiKey +grokApiKey +apiKeyAccessRequest');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const keysForPython = { gemini: null, grok: null };
        if (user.apiKeyAccessRequest?.status === 'approved') {
            keysForPython.gemini = process.env.ADMIN_GEMINI_API_KEY;
            keysForPython.grok = process.env.ADMIN_GROQ_API_KEY;
        } else {
            if (user.geminiApiKey) keysForPython.gemini = decrypt(user.geminiApiKey);
            if (user.grokApiKey) keysForPython.grok = decrypt(user.grokApiKey);
        }

        if (!keysForPython.gemini) {
            return res.status(400).json({ message: "A Gemini API key is required for podcast scripting." });
        }

        const fileTypeSubfolder = determineFileTypeSubfolder(documentName);
        const absoluteFilePath = path.resolve(__dirname, '..', 'assets', sanitizedUsername, fileTypeSubfolder, serverFilename);

        if (!fs.existsSync(absoluteFilePath)) {
            console.error(`Podcast Gen Error: File not found at constructed path: ${absoluteFilePath}`);
            return res.status(404).json({ message: `File '${documentName}' could not be located on the server.` });
        }

        const pythonPayload = {
            file_path: absoluteFilePath,
            document_name: documentName,
            api_keys: keysForPython,
        };

        const pythonResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/generate_podcast`, pythonPayload);
        res.status(pythonResponse.status).json(pythonResponse.data);

    } catch (error) {
        console.error('Error proxying to podcast generation service:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.error || "Failed to start podcast generation." });
    }
});

// GET /api/podcast/status/:taskId
router.get('/status/:taskId', async (req, res) => {
    const { taskId } = req.params;
    if (!PYTHON_AI_SERVICE_URL) {
        return res.status(503).json({ message: "AI Service is unavailable." });
    }
    try {
        const pythonResponse = await axios.get(`${PYTHON_AI_SERVICE_URL}/podcast_status/${taskId}`);
        res.status(pythonResponse.status).json(pythonResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ message: error.response?.data?.error || "Failed to get podcast status." });
    }
});

// The download proxy route is no longer needed.
module.exports = router;