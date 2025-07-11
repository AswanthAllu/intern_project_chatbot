#!/usr/bin/env node

/**
 * RAG Memory Helper Script
 * 
 * This script helps diagnose and manage memory issues with RAG processing.
 * Run this script to get information about your system and RAG setup.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbotGeminiDB4';

async function checkSystemInfo() {
    console.log('=== RAG Memory Helper ===\n');
    
    // Check Node.js version and memory
    console.log('📊 System Information:');
    console.log(`   Node.js version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    console.log(`   Memory limit: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`);
    console.log(`   Available memory: ${Math.round(require('os').freemem() / 1024 / 1024)}MB`);
    console.log(`   Total memory: ${Math.round(require('os').totalmem() / 1024 / 1024)}MB`);
    
    // Check environment variables
    console.log('\n🔧 Environment Variables:');
    console.log(`   HF_API_KEY: ${process.env.HF_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Not set'}`);
    console.log(`   SKIP_RAG_REPROCESSING: ${process.env.SKIP_RAG_REPROCESSING || 'false'}`);
    
    // Check vector store files
    console.log('\n📁 Vector Store Files:');
    const vectorStorePath = path.join(__dirname, '..', 'faiss_indices', 'vector_store.json');
    if (fs.existsSync(vectorStorePath)) {
        const stats = fs.statSync(vectorStorePath);
        console.log(`   Vector store file: ✅ ${Math.round(stats.size / 1024 / 1024)}MB`);
    } else {
        console.log('   Vector store file: ❌ Not found');
    }
    
    // Check cache directory
    const cachePath = path.join(__dirname, '..', 'cache');
    if (fs.existsSync(cachePath)) {
        console.log('   Cache directory: ✅ Exists');
    } else {
        console.log('   Cache directory: ❌ Not found');
    }
    
    // Connect to MongoDB and check files
    try {
        await mongoose.connect(MONGO_URI);
        console.log('\n🗄️ Database Information:');
        
        const File = require('../models/File');
        const allFiles = await File.find({}).sort({ createdAt: -1 });
        
        console.log(`   Total files in database: ${allFiles.length}`);
        
        if (allFiles.length > 0) {
            const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
            console.log(`   Total file size: ${Math.round(totalSize / 1024 / 1024)}MB`);
            
            const largeFiles = allFiles.filter(file => (file.size || 0) > 50 * 1024 * 1024);
            if (largeFiles.length > 0) {
                console.log(`   Large files (>50MB): ${largeFiles.length}`);
                largeFiles.forEach(file => {
                    console.log(`     - ${file.originalname}: ${Math.round((file.size || 0) / 1024 / 1024)}MB`);
                });
            }
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.log(`   Database connection: ❌ ${error.message}`);
    }
    
    console.log('\n💡 Recommendations:');
    console.log('   1. If you have memory issues, try:');
    console.log('      npm run start:gc-no-rag');
    console.log('   2. To process files later:');
    console.log('      npm run rag:process:gc');
    console.log('   3. To skip RAG processing entirely:');
    console.log('      npm run start:no-rag');
    console.log('   4. Set SKIP_RAG_REPROCESSING=true in your .env file');
    console.log('   5. Consider upgrading your system memory if available');
    
    console.log('\n🔧 Memory Optimization Tips:');
    console.log('   - Use --expose-gc flag to enable garbage collection');
    console.log('   - Process files in smaller batches');
    console.log('   - Skip large files (>50MB) during initial processing');
    console.log('   - Use quantized models when possible');
    console.log('   - Clear pipeline between batches');
    
    console.log('\n=== End ===\n');
}

// Run the check
checkSystemInfo().catch(console.error); 