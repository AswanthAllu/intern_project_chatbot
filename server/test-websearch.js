// server/test-websearch.js
const { performDuckDuckGoSearch } = require('./utils/webSearch');

async function testWebSearch() {
    console.log('🧪 Testing Web Search Functionality...\n');

    const testQueries = [
        'is perplexity ai free for airtel users',
        'JavaScript tutorial',
        'React hooks examples',
        'MongoDB setup guide',
        'artificial intelligence basics'
    ];

    for (const query of testQueries) {
        console.log(`🔍 Testing query: "${query}"`);
        try {
            const results = await performDuckDuckGoSearch(query);
            console.log(`✅ Found ${results.length} results`);
            
            if (results.length > 0) {
                console.log('📋 Sample results:');
                results.slice(0, 2).forEach((result, index) => {
                    console.log(`  ${index + 1}. ${result.title}`);
                    console.log(`     ${result.snippet.substring(0, 100)}...`);
                    console.log(`     URL: ${result.url}\n`);
                });
            } else {
                console.log('❌ No results found\n');
            }
        } catch (error) {
            console.error(`❌ Error for query "${query}":`, error.message);
        }
        console.log('─'.repeat(50));
    }

    console.log('✅ Web search test completed!');
}

// Run the test
testWebSearch().catch(console.error); 