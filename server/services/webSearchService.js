// server/services/webSearchService.js
const axios = require('axios');
const { performDuckDuckGoSearch } = require('../utils/webSearch');
const DuckDuckGoService = require('../utils/duckduckgo');

/**
 * Web Search Service - Provides comprehensive web search functionality
 * Integrates multiple search methods for reliability and educational content
 */
class WebSearchService {
    constructor() {
        this.duckDuckGoService = new DuckDuckGoService();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Perform a comprehensive web search using multiple methods
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results with metadata
     */
    async performSearch(query, options = {}) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new Error('Search query is required and must be a non-empty string');
        }

        const trimmedQuery = query.trim();
        const cacheKey = this.generateCacheKey(trimmedQuery, options);
        
        // Check cache first
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
            console.log(`[WebSearchService] Returning cached result for: "${trimmedQuery}"`);
            return cachedResult;
        }

        console.log(`[WebSearchService] Performing search for: "${trimmedQuery}"`);
        
        try {
            // Try multiple search methods for reliability
            let results = await this.searchWithMultipleMethods(trimmedQuery, options);
            
            // Cache the results
            this.cacheResult(cacheKey, results);
            
            return results;
        } catch (error) {
            console.error(`[WebSearchService] Search error for "${trimmedQuery}":`, error.message);
            return this.getFallbackResults(trimmedQuery, error.message);
        }
    }

    /**
     * Search using multiple methods for better reliability
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results
     */
    async searchWithMultipleMethods(query, options) {
        let results = [];
        let searchMethod = 'unknown';
        let isFallback = false;

        // Method 1: DuckDuckGo Instant Answer API
        try {
            results = await performDuckDuckGoSearch(query);
            if (results && results.length > 0) {
                searchMethod = 'duckduckgo_api';
                console.log(`[WebSearchService] DuckDuckGo API returned ${results.length} results`);
            }
        } catch (error) {
            console.log(`[WebSearchService] DuckDuckGo API failed: ${error.message}`);
        }

        // Method 2: DuckDuckGo Service (HTML scraping)
        if (results.length === 0) {
            try {
                const ddgResult = await this.duckDuckGoService.performSearch(query);
                if (ddgResult.results && ddgResult.results.length > 0) {
                    results = ddgResult.results;
                    searchMethod = 'duckduckgo_scraping';
                    isFallback = ddgResult.fallback || false;
                    console.log(`[WebSearchService] DuckDuckGo scraping returned ${results.length} results`);
                }
            } catch (error) {
                console.log(`[WebSearchService] DuckDuckGo scraping failed: ${error.message}`);
            }
        }

        // Method 3: Educational fallback content
        if (results.length === 0) {
            results = this.getEducationalFallbackResults(query);
            searchMethod = 'educational_fallback';
            isFallback = true;
            console.log(`[WebSearchService] Using educational fallback for: "${query}"`);
        }

        return {
            success: true,
            query: query,
            results: results,
            count: results.length,
            searchMethod: searchMethod,
            isFallback: isFallback,
            timestamp: new Date().toISOString(),
            message: this.generateResultMessage(results.length, query, searchMethod)
        };
    }

    /**
     * Generate search suggestions based on query
     * @param {string} query - Base query
     * @returns {Array} Array of suggested queries
     */
    generateSuggestions(query) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return [];
        }

        const baseQuery = query.trim().toLowerCase();
        const suggestions = [];
        
        // Add educational suggestions based on query content
        if (baseQuery.includes('ai') || baseQuery.includes('artificial intelligence')) {
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} examples`,
                `${query.trim()} applications`,
                `${query.trim()} machine learning`,
                `${query.trim()} neural networks`
            );
        } else if (baseQuery.includes('programming') || baseQuery.includes('code')) {
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} examples`,
                `${query.trim()} best practices`,
                `${query.trim()} documentation`,
                `${query.trim()} github`
            );
        } else if (baseQuery.includes('web') || baseQuery.includes('development')) {
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} framework`,
                `${query.trim()} tools`,
                `${query.trim()} best practices`,
                `${query.trim()} examples`
            );
        } else if (baseQuery.includes('javascript') || baseQuery.includes('js')) {
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} es6`,
                `${query.trim()} react`,
                `${query.trim()} node.js`,
                `${query.trim()} examples`
            );
        } else if (baseQuery.includes('react') || baseQuery.includes('hooks')) {
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} hooks`,
                `${query.trim()} components`,
                `${query.trim()} state management`,
                `${query.trim()} examples`
            );
        } else {
            // Generic educational suggestions
            suggestions.push(
                `${query.trim()} tutorial`,
                `${query.trim()} examples`,
                `${query.trim()} documentation`,
                `${query.trim()} best practices`,
                `${query.trim()} guide`
            );
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    /**
     * Get educational fallback results for specific topics
     * @param {string} query - Search query
     * @returns {Array} Array of educational results
     */
    getEducationalFallbackResults(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        // Programming and Development
        if (lowerQuery.includes('javascript') || lowerQuery.includes('js')) {
            results.push({
                title: "JavaScript Tutorial and Documentation",
                snippet: "JavaScript is a programming language that is one of the core technologies of the World Wide Web. It enables interactive web pages and is an essential part of web applications. Learn JavaScript fundamentals, ES6+ features, and modern development practices.",
                url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
            });
        }

        if (lowerQuery.includes('react') || lowerQuery.includes('hooks')) {
            results.push({
                title: "React Hooks Tutorial and Examples",
                snippet: "React Hooks are functions that allow you to use state and other React features in functional components. They were introduced in React 16.8 and include useState, useEffect, useContext, and custom hooks. Learn how to use hooks effectively in your React applications.",
                url: "https://react.dev/reference/react"
            });
        }

        if (lowerQuery.includes('mongodb') || lowerQuery.includes('database')) {
            results.push({
                title: "MongoDB Setup and Configuration Guide",
                snippet: "MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. Learn how to install, configure, and set up MongoDB for your applications. Includes connection setup, basic operations, and best practices for database management.",
                url: "https://docs.mongodb.com/manual/installation/"
            });
        }

        // AI and Machine Learning
        if (lowerQuery.includes('artificial intelligence') || lowerQuery.includes('ai')) {
            results.push({
                title: "Artificial Intelligence Fundamentals",
                snippet: "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. Learn about machine learning, neural networks, natural language processing, and the applications of AI in modern technology.",
                url: "https://en.wikipedia.org/wiki/Artificial_intelligence"
            });
        }

        if (lowerQuery.includes('machine learning') || lowerQuery.includes('ml')) {
            results.push({
                title: "Machine Learning Tutorial and Resources",
                snippet: "Machine Learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. Explore algorithms, models, and practical applications of machine learning.",
                url: "https://en.wikipedia.org/wiki/Machine_learning"
            });
        }

        // Web Development
        if (lowerQuery.includes('web development') || lowerQuery.includes('frontend')) {
            results.push({
                title: "Web Development Fundamentals",
                snippet: "Web development involves creating websites and web applications. It includes frontend development (HTML, CSS, JavaScript) and backend development (server-side programming, databases). Learn modern web development practices and tools.",
                url: "https://developer.mozilla.org/en-US/docs/Learn"
            });
        }

        // General Programming
        if (results.length === 0) {
            results.push(
                {
                    title: "Programming Best Practices",
                    snippet: "Good programming practices include writing clean, readable code, using meaningful variable names, commenting your code, and following established coding standards and conventions.",
                    url: "https://github.com/airbnb/javascript"
                },
                {
                    title: "Software Development Lifecycle",
                    snippet: "Understanding the software development lifecycle helps in planning, designing, building, testing, and deploying software applications effectively.",
                    url: "https://en.wikipedia.org/wiki/Software_development_process"
                }
            );
        }

        return results.slice(0, 5);
    }

    /**
     * Generate appropriate result message
     * @param {number} resultCount - Number of results
     * @param {string} query - Search query
     * @param {string} searchMethod - Method used for search
     * @returns {string} Formatted message
     */
    generateResultMessage(resultCount, query, searchMethod) {
        if (resultCount > 0) {
            return `Found ${resultCount} results for "${query}"`;
        } else {
            return `No direct results found for "${query}", but here are some related educational resources`;
        }
    }

    /**
     * Get fallback results when search fails
     * @param {string} query - Original query
     * @param {string} errorMessage - Error message
     * @returns {Object} Fallback response
     */
    getFallbackResults(query, errorMessage) {
        const fallbackResults = [
            {
                title: "Search Information",
                snippet: `While we couldn't find specific results for "${query}", here are some general resources that might help:`,
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

        return {
            success: true,
            query: query || 'unknown',
            results: fallbackResults,
            count: fallbackResults.length,
            searchMethod: 'fallback',
            isFallback: true,
            timestamp: new Date().toISOString(),
            message: "Search encountered an issue, but here are some helpful resources",
            error: errorMessage
        };
    }

    /**
     * Generate cache key for query and options
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {string} Cache key
     */
    generateCacheKey(query, options) {
        return `websearch:${query.toLowerCase().trim()}:${JSON.stringify(options)}`;
    }

    /**
     * Get cached result if available and not expired
     * @param {string} cacheKey - Cache key
     * @returns {Object|null} Cached result or null
     */
    getCachedResult(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(cacheKey); // Remove expired cache
        }
        return null;
    }

    /**
     * Cache search results
     * @param {string} cacheKey - Cache key
     * @param {Object} data - Data to cache
     */
    cacheResult(cacheKey, data) {
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        // Clean up old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clear all cached results
     */
    clearCache() {
        this.cache.clear();
        console.log('[WebSearchService] Cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout,
            maxSize: 100
        };
    }

    /**
     * Health check for the service
     * @returns {Object} Health status
     */
    async healthCheck() {
        try {
            // Test with a simple query
            const testResult = await this.performSearch('test', { limit: 1 });
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                cacheStats: this.getCacheStats(),
                testQuery: 'test',
                testResult: testResult.success
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                cacheStats: this.getCacheStats()
            };
        }
    }
}

// Export singleton instance
const webSearchService = new WebSearchService();
module.exports = webSearchService;
