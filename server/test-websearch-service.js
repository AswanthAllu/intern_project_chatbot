// server/test-websearch-service.js
const WebSearchService = require('./services/webSearchService');

async function testWebSearchService() {
    console.log('🧪 Testing New Web Search Service...\n');

    const testQueries = [
        'JavaScript tutorial',
        'React hooks examples',
        'MongoDB setup guide',
        'artificial intelligence basics',
        'web development best practices'
    ];

    for (const query of testQueries) {
        console.log(`🔍 Testing query: "${query}"`);
        try {
            const result = await WebSearchService.performSearch(query);
            console.log(`✅ Search successful`);
            console.log(`   Method: ${result.searchMethod}`);
            console.log(`   Results: ${result.count}`);
            console.log(`   Fallback: ${result.isFallback}`);
            console.log(`   Message: ${result.message}`);
            
            if (result.results && result.results.length > 0) {
                console.log('📋 Sample results:');
                result.results.slice(0, 2).forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.title}`);
                    console.log(`     ${item.snippet.substring(0, 80)}...`);
                    console.log(`     URL: ${item.url}\n`);
                });
            }
        } catch (error) {
            console.error(`❌ Error for query "${query}":`, error.message);
        }
        console.log('─'.repeat(50));
    }

    // Test suggestions
    console.log('\n🔍 Testing Search Suggestions...');
    const suggestionQueries = ['react', 'javascript', 'ai'];
    for (const query of suggestionQueries) {
        const suggestions = WebSearchService.generateSuggestions(query);
        console.log(`Suggestions for "${query}":`, suggestions);
    }

    // Test cache functionality
    console.log('\n🔍 Testing Cache Functionality...');
    const cacheStats = WebSearchService.getCacheStats();
    console.log('Cache stats:', cacheStats);

    // Test health check
    console.log('\n🔍 Testing Health Check...');
    try {
        const health = await WebSearchService.healthCheck();
        console.log('Health status:', health);
    } catch (error) {
        console.error('Health check failed:', error.message);
    }

    console.log('\n✅ Web search service test completed!');
}

// Run the test
testWebSearchService().catch(console.error); 