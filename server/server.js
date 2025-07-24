// server/server.js
const path = require('path');
const dotenv = require('dotenv');
<<<<<<< HEAD


const langchainVectorStore = require('./services/LangchainVectorStore');

// Make the .env file path absolute to avoid ambiguity
dotenv.config({ path: path.resolve(__dirname, '.env') });
const multer = require('multer'); // <-- Add this line if it's not there already
const express = require('express');
const cors = require('cors');
const { getLocalIPs } = require('./utils/networkUtils');
const fs = require('fs');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { performAssetCleanup } = require('./utils/assetCleanup');
const File = require('./models/File');
const serviceManager = require('./services/serviceManager');
const websearchRouter = require('./routes/websearch');

// Configuration
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbotGeminiDB4';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check for required environment variables but don't exit
=======
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');

const langchainVectorStore = require('./services/LangchainVectorStore');
const connectDB = require('./config/db');
const { getLocalIPs } = require('./utils/networkUtils');
const { performAssetCleanup } = require('./utils/assetCleanup');
const File = require('./models/File');
const serviceManager = require('./services/serviceManager');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbotGeminiDB4';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

>>>>>>> upstream/main
if (!GEMINI_API_KEY) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY environment variable is not set.");
    console.warn("⚠️  AI-powered features will be disabled, but the server will still run.");
    console.warn("⚠️  To enable AI features, set GEMINI_API_KEY in your .env file.");
}

const app = express();
<<<<<<< HEAD



langchainVectorStore.initialize().then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
    console.error("Failed to initialize services. Exiting.", err);
    process.exit(1);
});

//handle large files upload files
app.use(handleMulterError);



// Initialize middleware
app.use(cors());
app.use(express.json());

// Serve static files with proper MIME types
app.use('/podcasts', express.static(path.join(__dirname, 'public', 'podcasts'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.wav')) {
            res.setHeader('Content-Type', 'audio/wav');
        } else if (filePath.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        }
    }
}));

// Pass service manager to routes
app.use((req, res, next) => {
    req.serviceManager = serviceManager;
    next();
});



function handleMulterError(err, req, res, next) {
    // Check if the error is a Multer error and specifically the 'file too large' error
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File is too large. The maximum allowed size is 50MB.' });
    }
    
    // You could also handle other specific multer errors here if needed
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    }

    // If it's not a multer error, pass it on to the next error handler
    next(err);
}

let server;

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    try {
        if (server) {
            server.close(async () => {
                console.log('HTTP server closed.');
                    await mongoose.connection.close();
                    console.log('MongoDB connection closed.');
                process.exit(0);
            });
        } else {
                 await mongoose.connection.close();
                 console.log('MongoDB connection closed.');
            process.exit(0);
        }
        setTimeout(() => {
            console.error('Graceful shutdown timed out, forcing exit.');
            process.exit(1);
        }, 10000);
    } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Ensure required directories exist
const ensureDirectories = async () => {
    const dirs = [
        path.join(__dirname, 'assets'), 
        path.join(__dirname, 'backup_assets'),
        path.join(__dirname, 'public', 'podcasts')
    ];
    
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    }
};

// Reprocess all existing files for RAG
const reprocessFilesForRAG = async () => {
    try {
        // Check if RAG reprocessing is enabled via environment variable
        if (process.env.SKIP_RAG_REPROCESSING === 'true') {
            console.log("--- RAG File Reprocessing Skipped (SKIP_RAG_REPROCESSING=true) ---");
            return;
        }

        console.log("--- Starting RAG File Reprocessing ---");
        
        // Get all files from database
        const allFiles = await File.find({}).sort({ createdAt: -1 });
        console.log(`📊 Found ${allFiles.length} files to reprocess for RAG`);
        
        if (allFiles.length === 0) {
            console.log("✅ No files to reprocess");
            return;
        }
        
        let processedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        // Get documentProcessor from the service manager
        const { documentProcessor } = serviceManager.getServices();

        if (!documentProcessor) {
            console.error("❌ DocumentProcessor service not available. Skipping RAG reprocessing.");
            return;
        }

        // Process files in smaller batches to manage memory
        const batchSize = 3; // Process only 3 files at a time
        const delayBetweenBatches = 2000; // 2 seconds between batches

        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allFiles.length / batchSize)}`);
            
            for (const file of batch) {
                try {
                    // Check if file exists on disk
                    if (!fs.existsSync(file.path)) {
                        console.log(`❌ File not found on disk: ${file.originalname} (${file.path})`);
                        errorCount++;
                        continue;
                    }
                    
                    // Check file size - skip very large files to prevent memory issues
                    const stats = fs.statSync(file.path);
                    const fileSizeMB = stats.size / (1024 * 1024);
                    
                    if (fileSizeMB > 50) { // Skip files larger than 50MB
                        console.log(`⚠️ Skipping large file (${fileSizeMB.toFixed(1)}MB): ${file.originalname}`);
                        skippedCount++;
                        continue;
                    }
                    
                    console.log(`📄 Reprocessing: ${file.originalname} (User: ${file.user}) - ${fileSizeMB.toFixed(1)}MB`);
                    
                    // Process the file and add to vector store
                    const processingResult = await documentProcessor.processFile(file.path, {
                        userId: file.user,
                        originalName: file.originalname,
                        fileType: path.extname(file.path).substring(1)
                    });
                    
                    console.log(`✅ Reprocessed: ${file.originalname} - ${processingResult.chunksAdded} chunks added`);
                    processedCount++;
                    
                    // Small delay between individual files
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`❌ Error reprocessing ${file.originalname}:`, error.message);
                    
                    // If it's a memory error, try to clear the pipeline and continue
                    if (error.message.includes('memory') || error.message.includes('allocation')) {
                        console.log('🔄 Memory error detected, attempting to clear pipeline...');
                        try {
                            const { vectorStore } = serviceManager.getServices();
                            if (vectorStore && typeof vectorStore.clearPipeline === 'function') {
                                vectorStore.clearPipeline();
                            }
                        } catch (clearError) {
                            console.error('❌ Failed to clear pipeline:', clearError.message);
                        }
                    }
                    
                    errorCount++;
                }
            }
            
            // Delay between batches to allow memory cleanup
            if (i + batchSize < allFiles.length) {
                console.log(`⏳ Waiting ${delayBetweenBatches/1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
            }
        }
        
        console.log(`\n📈 RAG Reprocessing Summary:`);
        console.log(`  • Files reprocessed successfully: ${processedCount}`);
        console.log(`  • Files with errors: ${errorCount}`);
        console.log(`  • Files skipped (too large): ${skippedCount}`);
        console.log(`  • Total files: ${allFiles.length}`);
        
        if (processedCount > 0) {
            console.log(`🎉 Successfully reprocessed ${processedCount} files for RAG!`);
            console.log('💡 RAG system is now ready to answer questions from your documents.');
        }
        
        if (errorCount > 0) {
            console.log(`⚠️ ${errorCount} files failed to process. You can retry later or check the logs.`);
        }
        
        console.log("--- Finished RAG File Reprocessing ---\n");
        
    } catch (error) {
        console.error("❌ Error during RAG file reprocessing:", error);
        console.log("💡 You can set SKIP_RAG_REPROCESSING=true in your .env file to skip this step.");
        // Don't fail server startup if RAG reprocessing fails
    }
};

// Start server
const startServer = async () => {
    try {
        console.log("--- Starting Server ---");
        
        // Ensure directories exist
        await ensureDirectories();
        
        // Connect to MongoDB
        await connectDB(MONGO_URI);
        console.log("✓ MongoDB connected successfully");
        
        // Initialize services via the manager
        await serviceManager.initialize();
        
        // Perform asset cleanup
        await performAssetCleanup();
        
        // Reprocess all files for RAG
        await reprocessFilesForRAG();

        // Mount API routes
        app.get('/', (req, res) => res.send('Chatbot Backend API is running...'));
        // --- ISOLATION STEP 1: Comment out all routes to find the source of the error ---
=======
app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        console.log("--- Starting Server ---");
        await connectDB(MONGO_URI);
        console.log("✓ MongoDB connected successfully");

        await serviceManager.initialize();
        await performAssetCleanup();

        app.use((req, res, next) => {
            req.serviceManager = serviceManager;
            next();
        });

        app.use('/podcasts', express.static(path.join(__dirname, 'public', 'podcasts')));

        // Routes
        app.get('/', (req, res) => res.send('Chatbot Backend API is running...'));
>>>>>>> upstream/main
        app.use('/api/network', require('./routes/network'));
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/chat', require('./routes/chat'));
        app.use('/api/upload', require('./routes/upload'));
        app.use('/api/files', require('./routes/files'));
        app.use('/api/podcast', require('./routes/podcast'));
        app.use('/api/mindmap', require('./routes/mindmap'));
<<<<<<< HEAD
        app.use('/api/websearch', websearchRouter);


        // Centralized error handler - MUST be after routes
        app.use((err, req, res, next) => {
            console.error("Error in request:", err);
            res.status(500).send('Internal Server Error');
        });
        
        // Start listening
        const availableIPs = getLocalIPs();
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n=== Server Ready ===');
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log('Access URLs:');
            const frontendPorts = [3005, 3001, 8080, 5173];
            availableIPs.forEach(ip => {
                 frontendPorts.forEach(fp => {
                    console.log(`   - http://${ip}:${fp} (Frontend) -> Backend: http://${ip}:${PORT}`);
                 });
            });
            console.log('==================\n');
        });
        
=======

        const availableIPs = getLocalIPs();
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n=== Server Ready ===');
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log('Access URLs:');
            availableIPs.forEach(ip => {
                console.log(`   - http://${ip}:3004 (Frontend) -> Backend: http://${ip}:${PORT}`);
            });
            console.log('==================\n');
        });
>>>>>>> upstream/main
    } catch (error) {
        console.error("!!! Failed to start server:", error.message);
        process.exit(1);
    }
};

<<<<<<< HEAD
app.use(handleMulterError);




// Initialize the new vector store before starting the server
langchainVectorStore.initialize().then(() => {
    console.log("Vector store initialized successfully");
}).catch(err => {
    console.error("Failed to initialize vector store. Exiting.", err);
    process.exit(1);
});



// Start if this is the main module
if (require.main === module) {
    startServer();
}

=======
startServer();
>>>>>>> upstream/main
module.exports = app;