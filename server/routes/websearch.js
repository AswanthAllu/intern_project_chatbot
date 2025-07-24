const express = require('express');
const router = express.Router();
const { webSearch } = require('../services/webSearchService');

// GET /api/websearch?q=your+query
router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  try {
    const results = await webSearch(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Web search failed', details: error.message });
  }
});

module.exports = router; 