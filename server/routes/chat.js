// server/routes/chat.js
const express = require('express');
const router = express.Router();
const { tempAuth } = require('../middleware/authMiddleware');
const { 
    getSessions, 
    getSessionDetails, 
    createSession, 
    saveChatHistory,
    handleStandardMessage,
    handleRagMessage,
<<<<<<< HEAD
    handleDeepSearch
} = require('../controllers/chatController');
const { ChatSession, SESSION_STATES, SESSION_CONTEXTS, MESSAGE_TYPES } = require('../models/ChatSession');
const DeepSearchService = require('../deep_search/services/deepSearchService');
const { webSearch } = require('../services/webSearchService');
=======
    handleDeepSearch,
    deleteSession,
    handleHybridRagMessage, // <-- Import the new controller function
} = require('../controllers/chatController');
const { ChatSession, SESSION_STATES, SESSION_CONTEXTS, MESSAGE_TYPES } = require('../models/ChatSession');
const DeepSearchService = require('../deep_search/services/deepSearchService');
>>>>>>> upstream/main


// --- Session Management Endpoints ---

// Create a new session
router.post('/session', tempAuth, createSession);

// Get all sessions for user
router.get('/sessions', tempAuth, getSessions);

// Get the full details of a specific chat session
router.get('/session/:sessionId', tempAuth, getSessionDetails);

<<<<<<< HEAD
=======
// Delete a specific chat session
router.delete('/session/:sessionId', tempAuth, deleteSession);

>>>>>>> upstream/main
// Save chat history
router.post('/history', tempAuth, saveChatHistory);


// --- Core Chat Endpoints ---

// Handles standard chat messages without RAG
router.post('/message', tempAuth, handleStandardMessage);

<<<<<<< HEAD
// Handles chat messages that require RAG
router.post('/rag', tempAuth, handleRagMessage);

// Perform deep search with AI-powered query decomposition and synthesis
router.post('/deep-search', tempAuth, handleDeepSearch);

// Example POST /api/chat route
router.post('/', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  // Broader keyword-based trigger for web search/manual fallback
  const shouldWebSearch = /websites?|best sites?|resources?|where can I|how to|what is|who is|top sites?|practice coding|coding practice|learn coding|coding platforms|coding websites|platforms to practice coding|sites to practice coding|websites to practice coding/i.test(query);

  if (shouldWebSearch) {
    try {
      const webResults = await webSearch(query); // always returns an array of {title, url}
      return res.json({ source: 'web', results: webResults });
    } catch (error) {
      return res.status(500).json({ error: 'Web search failed', details: error.message });
    }
  }

  // Otherwise, use your chatbot/database logic
  const botResponse = await yourChatbotFunction(query); // Replace with your actual function
  return res.json({ source: 'bot', results: botResponse });
});

=======
// Handles chat messages that require RAG (Legacy - can be removed later)
router.post('/rag', tempAuth, handleRagMessage);

// NEW EFFICIENT RAG ROUTE
router.post('/rag-v2', tempAuth, handleHybridRagMessage);

// Perform deep search with AI-powered query decomposition and synthesis
router.post('/deep-search', tempAuth, handleDeepSearch);

>>>>>>> upstream/main
module.exports = router;