// server/routes/websearch.js
const express = require('express');
const router = express.Router();
const serviceManager = require('../services/serviceManager');

/**
 * @route POST /api/websearch
 * @desc Perform a web search using DuckDuckGo
 * @access Private
 */
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required and must be a non-empty string'
            });
        }

        const trimmedQuery = query.trim();
        console.log(`[WebSearch] Performing search for: "${trimmedQuery}"`);
        
        const { webSearchService } = serviceManager.getServices();
        const searchResults = await webSearchService.performSearch(trimmedQuery);
        
        console.log(`[WebSearch] Search completed. Found ${searchResults.count} results for: "${trimmedQuery}"`);
        
        // Return the standardized response from the service
        res.json(searchResults);

    } catch (error) {
        console.error('[WebSearch] Error:', error.message);
        
        // Return fallback results instead of error
        const fallbackResults = [
            {
                title: "Search Information",
                snippet: `While we couldn't find specific results for "${req.body?.query || 'your query'}", here are some general resources that might help:`,
                url: "#"
            },
            {
                title: "How to Improve Your Search",
                snippet: "Try using more specific keywords, check your spelling, or rephrase your question to get better results.",
                url: "https://support.google.com/websearch/answer/134479"
            },
            {
                title: "Alternative Search Strategies",
                snippet: "Consider using different search terms, breaking down complex queries, or searching for related topics.",
                url: "https://www.google.com/search"
            }
        ];

        res.json({
            success: true,
            query: req.body?.query || 'unknown',
            results: fallbackResults,
            count: fallbackResults.length,
            timestamp: new Date().toISOString(),
            message: "Search encountered an issue, but here are some helpful resources"
        });
    }
});

/**
 * @route GET /api/websearch/suggestions
 * @desc Get search suggestions for a query
 * @access Private
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required'
            });
        }

        // Use the web search service to generate suggestions
        const { webSearchService } = serviceManager.getServices();
        const suggestions = webSearchService.generateSuggestions(q.trim());

        res.json({
            success: true,
            query: q.trim(),
            suggestions: suggestions.slice(0, 5) // Limit to 5 suggestions
        });

    } catch (error) {
        console.error('[WebSearch Suggestions] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get search suggestions',
            error: error.message
        });
    }
});

/**
 * @route GET /api/websearch/health
 * @desc Check if web search service is working
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const { webSearchService } = serviceManager.getServices();
        const healthStatus = await webSearchService.healthCheck();
        
        res.json({
            success: true,
            service: 'Web Search',
            status: healthStatus.status,
            timestamp: healthStatus.timestamp,
            message: healthStatus.status === 'healthy' ? 'Web search service is running' : 'Web search service has issues',
            cacheStats: healthStatus.cacheStats,
            testResult: healthStatus.testResult
        });
    } catch (error) {
        console.error('[WebSearch Health] Error:', error.message);
        res.status(500).json({
            success: false,
            service: 'Web Search',
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Web search service health check failed',
            error: error.message
        });
    }
});

module.exports = router; 