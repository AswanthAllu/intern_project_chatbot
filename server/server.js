// server/server.js
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables FIRST before importing any services
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Polyfill for Node.js 18 compatibility with undici
if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File {
        constructor(fileBits, fileName, options = {}) {
            this.name = fileName;
            this.type = options.type || '';
            this.lastModified = options.lastModified || Date.now();
            this.size = 0;
        }
    };
}

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

const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbotGeminiDB4';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY environment variable is not set.");
    console.warn("⚠️  AI-powered features will be disabled, but the server will still run.");
    console.warn("⚠️  To enable AI features, set GEMINI_API_KEY in your .env file.");
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
    });
});

const startServer = async () => {
    try {
        console.log("--- Starting Server ---");

        // Try to connect to MongoDB with fallback
        try {
            await connectDB(MONGO_URI);
            console.log("✓ MongoDB connected successfully");
        } catch (dbError) {
            console.warn("⚠️ MongoDB connection failed:", dbError.message);
            console.warn("⚠️ Server will continue without database features");
        }

        await serviceManager.initialize();

        // Start Agent MCP shim (Python) in background
        try {
            const mcpSpawner = require('./services/agentMcpSpawner');
            // Set a shorter timeout and continue if MCP fails
            const mcpTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MCP startup timeout')), 10000)
            );
            await Promise.race([mcpSpawner.start(), mcpTimeout]);
            console.log('✓ MCP agent server started');
        } catch (mcpErr) {
            console.warn('⚠️ MCP agent server failed to start:', mcpErr.message);
        }

        // Initialize user service manager
        const userServiceManager = require('./services/userServiceManager');
        await userServiceManager.initialize();

        try {
            await performAssetCleanup();
        } catch (cleanupError) {
            console.warn("⚠️ Asset cleanup failed:", cleanupError.message);
        }

        app.use((req, res, next) => {
            req.serviceManager = serviceManager;
            next();
        });

        app.use('/podcasts', express.static(path.join(__dirname, 'public', 'podcasts')));

        // Routes
        app.get('/', (req, res) => res.send('Chatbot Backend API is running...'));

        try {
            app.use('/api/network', require('./routes/network'));
            app.use('/api/auth', require('./routes/auth'));
            app.use('/api/chat', require('./routes/chat'));
            app.use('/api/upload', require('./routes/upload'));
            app.use('/api/files', require('./routes/files'));
            app.use('/api/podcast', require('./routes/podcast'));
            app.use('/api/mindmap', require('./routes/mindmap'));
            app.use('/api/memory', require('./routes/memory')); // <-- ADD THIS LINE
            app.use('/api/multi-model', require('./routes/multiModel')); // Multi-model LLM routes
            app.use('/api/multi-llm', require('./routes/multiLLM')); // Intelligent Multi-LLM routing
            app.use('/api/user-ollama', require('./routes/userOllama')); // User-specific Ollama configuration
            app.use('/api/user', require('./routes/userSettings')); // User settings and API key management
            app.use('/api/models', require('./routes/modelRouter')); // Model management and switching
            app.use('/api/training', require('./routes/training')); // LLM Training routes
            app.use('/api/subjects', require('./routes/subjects')); // Custom subjects and model management
            app.use('/api/user-api-keys', require('./routes/userApiKeys')); // User API key management
            app.use('/api/admin', require('./routes/admin')); // Admin dashboard and user management
            app.use('/api/research', require('./routes/testResearch')); // Advanced Deep Research testing
            app.use('/api/agents', require('./routes/agents')); // Agentic MCP bridge
        } catch (routeError) {
            console.error('!!! Error loading routes:', routeError.message);
            console.error('Stack:', routeError.stack);
            throw routeError;
        }

        // Initialize monitoring routes with metrics collector
        const monitoringRoutes = require('./routes/monitoring');
        monitoringRoutes.setMetricsCollector(serviceManager.getMetricsCollector());
        app.use('/api/monitoring', monitoringRoutes);

        const availableIPs = getLocalIPs();
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n=== Server Ready ===');
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log('Access URLs:');
            availableIPs.forEach(ip => {
                console.log(`   - http://${ip}:3004 (Frontend) -> Backend: http://${ip}:${PORT}`);
            });
            console.log('==================\n');
        });

        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

            server.close(async () => {
                console.log('📡 HTTP server closed');

                try {
                    await serviceManager.cleanup();
                    console.log('🧹 Services cleaned up');

                    // Stop MCP shim
                    try {
                        const mcpSpawner = require('./services/agentMcpSpawner');
                        await mcpSpawner.stop();
                        console.log('🛑 MCP agent server stopped');
                    } catch (_) { }

                    // Only close MongoDB if it's connected
                    if (mongoose.connection.readyState === 1) {
                        await mongoose.connection.close();
                        console.log('🗄️ Database connection closed');
                    }

                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
        console.error("!!! Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
module.exports = app;