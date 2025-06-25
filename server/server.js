// server/server.js

// --- DOTENV AND PATH CONFIGURATION AT THE VERY TOP ---
const path = require('path');
const dotenv = require('dotenv');

// Explicitly configure dotenv to load the .env file from the current directory
const envPath = path.resolve(__dirname, '.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FATAL ERROR: Could not find or load the .env file. !!!");
    console.error("!!! Please ensure a .env file exists in the /server directory.", dotenvResult.error);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    process.exit(1); // Stop the server if .env can't be found
}

// --- DEBUG CHECK TO VERIFY ENVIRONMENT VARIABLES ---
console.log("--- DEBUG: Checking Environment Variables ---");
console.log("Value of API_ENCRYPTION_KEY is:", process.env.API_ENCRYPTION_KEY);
console.log("Value of JWT_SECRET is:", process.env.JWT_SECRET);
console.log("--- END DEBUG ---");
// --- END OF CONFIGURATION AND DEBUG ---


const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

// --- Custom Modules & Middleware ---
const connectDB = require('./config/db');
const { getLocalIPs } = require('./utils/networkUtils');
const { performAssetCleanup } = require('./utils/assetCleanup');
const { tempAuth } = require('./middleware/authMiddleware');

// --- Route Imports ---
const networkRoutes = require('./routes/network');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');
const filesRoutes = require('./routes/files');
const syllabusRoutes = require('./routes/syllabus');
const analysisRoutes = require('./routes/analysis');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings'); 
const podcastRoutes = require('./routes/podcast');

// --- Configuration Defaults & Variables ---
const DEFAULT_PORT = 5001;
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/chatbotGeminiDB';
const DEFAULT_PYTHON_RAG_URL = 'http://127.0.0.1:9000'; // Using direct IP for reliability

let port = process.env.PORT || DEFAULT_PORT;
let mongoUri = process.env.MONGO_URI || '';
let pythonRagUrl = process.env.PYTHON_AI_CORE_SERVICE_URL || '';

if (!process.env.JWT_SECRET || !process.env.API_ENCRYPTION_KEY) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FATAL: JWT_SECRET or API_ENCRYPTION_KEY is not set in .env   !!!");
    console.error("!!! Please ensure both are set in your .env file before running. !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    process.exit(1);
}

// --- Express Application Setup ---
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'x-user-id'],
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Basic Root Route ---
app.get('/', (req, res) => res.send('Chatbot Backend API is running...'));

// --- API Route Mounting ---
// Public routes that do not require authentication
app.use('/api/network', networkRoutes);
app.use('/api/auth', authRoutes);

// Protected routes that require authentication
const protectedRouter = express.Router();
protectedRouter.use(tempAuth);

protectedRouter.use('/user', userRoutes);
protectedRouter.use('/chat', chatRoutes);
protectedRouter.use('/upload', uploadRoutes);
protectedRouter.use('/files', filesRoutes);
protectedRouter.use('/syllabus', syllabusRoutes);
protectedRouter.use('/analysis', analysisRoutes);
protectedRouter.use('/admin', adminRoutes);
protectedRouter.use('/settings', settingsRoutes); 
protectedRouter.use('/podcast', podcastRoutes);

app.use('/api', protectedRouter);


// --- Centralized Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);
    const statusCode = err.status || 500;
    let message = err.message || 'An internal server error occurred.';
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An internal server error occurred.';
    }
    if (req.originalUrl.startsWith('/api/')) {
         return res.status(statusCode).json({ message: message });
    }
    res.status(statusCode).send(message);
});

// --- Server Instance Variable ---
let server;

// --- Graceful Shutdown Logic (Unchanged) ---
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    readline.close();
    try {
        if (server) {
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await mongoose.connection.close();
                    console.log('MongoDB connection closed.');
                } catch (dbCloseError) {
                    console.error("Error closing MongoDB connection:", dbCloseError);
                }
                process.exit(0);
            });
        } else {
             try {
                 await mongoose.connection.close();
                 console.log('MongoDB connection closed (no HTTP server instance).');
             } catch (dbCloseError) {
                 console.error("Error closing MongoDB connection:", dbCloseError);
             }
            process.exit(0);
        }

        setTimeout(() => {
            console.error('Graceful shutdown timed out, forcing exit.');
            process.exit(1);
        }, 10000);

    } catch (shutdownError) {
        console.error("Error during graceful shutdown initiation:", shutdownError);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- RAG Service Health Check (Unchanged) ---
async function checkRagService(url) {
    console.log(`\nChecking AI Core service health at ${url}...`);
    try {
        const response = await axios.get(`${url}/health`, { timeout: 7000 });
        if (response.status === 200 && response.data?.status === 'ok') {
            console.log('✓ Python AI Core service is available and healthy.');
            return true;
        } else {
             console.warn(`! Python AI Core service responded but status is not OK: ${response.status} - ${JSON.stringify(response.data)}`);
             return false;
        }
    } catch (error) {
        console.warn('! Python AI Core service is not reachable.');
        if (error.code === 'ECONNREFUSED') {
             console.warn(`  Connection refused at ${url}. Ensure the Python service is running.`);
        } else {
             console.warn(`  Error connecting to Python AI Core Service: ${error.message}`);
        }
        return false;
    }
}

// --- Directory Structure Check (Unchanged) ---
async function ensureServerDirectories() {
    const dirs = [
        path.join(__dirname, 'assets'),
        path.join(__dirname, 'backup_assets'),
        path.join(__dirname, 'syllabi')
    ];
    console.log("\nEnsuring server directories exist...");
    try {
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
                console.log(`  Created directory: ${dir}`);
            }
        }
        console.log("✓ Server directories checked/created.");
    } catch (error) {
        console.error('!!! Error creating essential server directories:', error);
        throw error;
    }
}

// --- Prompt for Configuration (Unchanged) ---
function askQuestion(query) {
    return new Promise(resolve => readline.question(query, resolve));
}

async function configureAndStart() {
    console.log("--- Starting Server Configuration ---");
    
    if (!mongoUri) {
        const answer = await askQuestion(`Enter MongoDB URI or press Enter for default (${DEFAULT_MONGO_URI}): `);
        mongoUri = answer.trim() || DEFAULT_MONGO_URI;
    }
    console.log(`Using MongoDB URI: ${mongoUri}`);

    if (!pythonRagUrl) {
        const answer = await askQuestion(`Enter Python AI Core Service URL or press Enter for default (${DEFAULT_PYTHON_RAG_URL}): `);
        pythonRagUrl = answer.trim() || DEFAULT_PYTHON_RAG_URL;
    }
    console.log(`Using Python AI Core Service URL: ${pythonRagUrl}`);
    console.log(`Node.js server will listen on port: ${port}`);
    readline.close();

    process.env.MONGO_URI = mongoUri;
    process.env.PYTHON_AI_CORE_SERVICE_URL = pythonRagUrl;

    console.log("--- Configuration Complete ---");
    await startServer();
}

// --- Asynchronous Server Startup Function (Unchanged) ---
async function startServer() {
    console.log("\n--- Starting Server Initialization ---");
    try {
        await ensureServerDirectories();
        await connectDB(mongoUri); 
        await performAssetCleanup(); 
        await checkRagService(pythonRagUrl);

        const PORT = port;
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n=== Node.js Server Ready ===');
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log('============================\n');
        });

    } catch (error) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! Failed to start Node.js server:", error.message);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        process.exit(1);
    }
}

// --- Execute Configuration and Server Start ---
configureAndStart();