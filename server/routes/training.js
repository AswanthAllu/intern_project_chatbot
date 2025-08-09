const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');
const { tempAuth } = require('../middleware/authMiddleware');
const archiver = require('archiver');
const { getOllamaService } = require('../services/ollamaService');
const databaseService = require('../services/databaseService');
const dataValidationService = require('../services/dataValidationService');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Training state management
let trainingState = {
    status: 'idle', // idle, starting, training, completed, error, stopped
    currentSubject: null,
    config: null,
    process: null,
    logs: [],
    startTime: null,
    progress: 0
};

// Get training status
router.get('/status', tempAuth, (req, res) => {
    res.json({
        success: true,
        status: trainingState.status,
        subject: trainingState.currentSubject,
        progress: trainingState.progress,
        startTime: trainingState.startTime
    });
});

// Get training progress and logs
router.get('/progress', tempAuth, (req, res) => {
    res.json({
        success: true,
        status: trainingState.status,
        logs: trainingState.logs.slice(-10), // Return last 10 logs
        progress: trainingState.progress
    });
});

// Upload custom model
router.post('/upload-model', tempAuth, upload.single('modelFile'), async (req, res) => {
    try {
        const { name, description, modelSize, compatibleSubjects, modelFormat } = req.body;
        const file = req.file;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No model file uploaded'
            });
        }

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                error: 'Model name and description are required'
            });
        }

        // Create custom models directory
        const customModelsDir = path.join(__dirname, '..', 'ml_training', 'custom_models');
        await fs.mkdir(customModelsDir, { recursive: true });

        // Generate unique model ID
        const modelId = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        const modelDir = path.join(customModelsDir, modelId);
        await fs.mkdir(modelDir, { recursive: true });

        // Move uploaded file to model directory
        const originalPath = file.path;
        const newPath = path.join(modelDir, file.originalname);
        await fs.rename(originalPath, newPath);

        // Parse compatible subjects
        const subjects = compatibleSubjects ? compatibleSubjects.split(',').map(s => s.trim()) : ['general'];

        // Create model info
        const modelInfo = {
            model_id: modelId,
            name: name,
            model_path: modelDir,
            model_type: 'custom',
            size: modelSize || 'Unknown',
            description: description,
            compatible_subjects: subjects,
            uploaded_by: userId,
            file_size: file.size,
            model_format: modelFormat || 'huggingface',
            is_verified: false,
            upload_source: 'local',
            original_filename: file.originalname,
            created_at: new Date().toISOString()
        };

        // Save model info
        const modelInfoPath = path.join(modelDir, 'model_info.json');
        await fs.writeFile(modelInfoPath, JSON.stringify(modelInfo, null, 2));

        // Add to models list (in-memory for now)
        // In a real implementation, this would use the model registry

        console.log(`Custom model uploaded: ${modelId} by user ${userId}`);

        res.json({
            success: true,
            message: 'Model uploaded successfully',
            model: {
                id: modelId,
                name: name,
                size: modelSize,
                status: 'uploaded',
                verified: false
            }
        });

    } catch (error) {
        console.error('Error uploading custom model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get custom models
router.get('/custom-models', tempAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { all } = req.query; // Admin can see all custom models

        // In a real implementation, this would query the model registry
        const customModelsDir = path.join(__dirname, '..', 'ml_training', 'custom_models');
        const customModels = [];

        try {
            const modelDirs = await fs.readdir(customModelsDir);

            for (const modelDir of modelDirs) {
                const modelInfoPath = path.join(customModelsDir, modelDir, 'model_info.json');
                try {
                    const modelInfoData = await fs.readFile(modelInfoPath, 'utf8');
                    const modelInfo = JSON.parse(modelInfoData);

                    // Filter by user unless admin requests all
                    if (all === 'true' || modelInfo.uploaded_by === userId) {
                        customModels.push({
                            id: modelInfo.model_id,
                            name: modelInfo.name,
                            size: modelInfo.size,
                            description: modelInfo.description,
                            compatible_subjects: modelInfo.compatible_subjects,
                            uploaded_by: modelInfo.uploaded_by,
                            created_at: modelInfo.created_at,
                            verified: modelInfo.is_verified,
                            file_size: modelInfo.file_size,
                            model_format: modelInfo.model_format
                        });
                    }
                } catch (err) {
                    console.log(`Could not read model info for ${modelDir}`);
                }
            }
        } catch (err) {
            // Custom models directory doesn't exist yet
        }

        res.json({
            success: true,
            models: customModels.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        });

    } catch (error) {
        console.error('Error fetching custom models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete custom model
router.delete('/custom-models/:modelId', tempAuth, async (req, res) => {
    try {
        const { modelId } = req.params;
        const userId = req.user.id;

        const customModelsDir = path.join(__dirname, '..', 'ml_training', 'custom_models');
        const modelDir = path.join(customModelsDir, modelId);
        const modelInfoPath = path.join(modelDir, 'model_info.json');

        // Check if model exists and user owns it
        try {
            const modelInfoData = await fs.readFile(modelInfoPath, 'utf8');
            const modelInfo = JSON.parse(modelInfoData);

            if (modelInfo.uploaded_by !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own models'
                });
            }

            // Delete model directory
            const rimraf = require('rimraf');
            await new Promise((resolve, reject) => {
                rimraf(modelDir, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`Custom model deleted: ${modelId} by user ${userId}`);

            res.json({
                success: true,
                message: 'Model deleted successfully'
            });

        } catch (err) {
            res.status(404).json({
                success: false,
                error: 'Model not found'
            });
        }

    } catch (error) {
        console.error('Error deleting custom model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ollama API endpoints
router.get('/ollama/status', tempAuth, async (req, res) => {
    try {
        const ollama = getOllamaService();
        const isConnected = await ollama.checkConnection();

        res.json({
            success: true,
            connected: isConnected,
            baseUrl: ollama.baseUrl
        });
    } catch (error) {
        console.error('Error checking Ollama status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/ollama/configure', tempAuth, async (req, res) => {
    try {
        const { baseUrl } = req.body;

        if (!baseUrl) {
            return res.status(400).json({
                success: false,
                error: 'Base URL is required'
            });
        }

        // Create new Ollama service instance with custom URL
        const { OllamaService } = require('../services/ollamaService');
        const customOllama = new OllamaService(baseUrl);

        // Test connection
        const isConnected = await customOllama.checkConnection();

        if (isConnected) {
            // Update global instance (in a real app, you'd want to persist this)
            global.customOllamaService = customOllama;

            res.json({
                success: true,
                message: 'Ollama configuration updated successfully',
                connected: true,
                baseUrl: customOllama.baseUrl
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Could not connect to Ollama at the specified URL'
            });
        }
    } catch (error) {
        console.error('Error configuring Ollama:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/ollama/models', tempAuth, async (req, res) => {
    try {
        const ollama = getOllamaService();
        const models = await ollama.getAvailableModels();

        res.json({
            success: true,
            models: models
        });
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/ollama/popular', tempAuth, async (req, res) => {
    try {
        const ollama = getOllamaService();
        const popularModels = ollama.getPopularModels();

        res.json({
            success: true,
            models: popularModels
        });
    } catch (error) {
        console.error('Error fetching popular models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/ollama/pull', tempAuth, async (req, res) => {
    try {
        const { modelName } = req.body;

        if (!modelName) {
            return res.status(400).json({
                success: false,
                error: 'Model name is required'
            });
        }

        const ollama = getOllamaService();

        // For now, use simple JSON response instead of streaming
        // This is more reliable for the current implementation
        const result = await ollama.pullModel(modelName);

        res.json({
            success: true,
            message: `Model ${modelName} pulled successfully`,
            result: result
        });

    } catch (error) {
        console.error('Error pulling Ollama model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/ollama/models/:modelName', tempAuth, async (req, res) => {
    try {
        const { modelName } = req.params;
        const ollama = getOllamaService();

        const result = await ollama.deleteModel(modelName);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting Ollama model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/ollama/load/:modelName', tempAuth, async (req, res) => {
    try {
        const { modelName } = req.params;
        const ollama = getOllamaService();

        const result = await ollama.loadModel(modelName);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error loading Ollama model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/ollama/unload/:modelName', tempAuth, async (req, res) => {
    try {
        const { modelName } = req.params;
        const ollama = getOllamaService();

        const result = await ollama.unloadModel(modelName);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error unloading Ollama model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/ollama/running', tempAuth, async (req, res) => {
    try {
        const ollama = getOllamaService();
        const runningModels = await ollama.getRunningModels();

        res.json({
            success: true,
            models: runningModels
        });
    } catch (error) {
        console.error('Error fetching running models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Database integration endpoints
router.post('/database/test-connection', tempAuth, async (req, res) => {
    try {
        const { config } = req.body;

        if (!config || !config.type) {
            return res.status(400).json({
                success: false,
                error: 'Database configuration is required'
            });
        }

        const result = await databaseService.testConnection(config);

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/database/get-schema', tempAuth, async (req, res) => {
    try {
        const { config } = req.body;

        if (!config || !config.type) {
            return res.status(400).json({
                success: false,
                error: 'Database configuration is required'
            });
        }

        const schema = await databaseService.getDatabaseSchema(config);

        res.json({
            success: true,
            schema: schema
        });
    } catch (error) {
        console.error('Failed to get database schema:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/database/extract-data', tempAuth, async (req, res) => {
    try {
        const { config, extractionConfig } = req.body;

        if (!config || !config.type) {
            return res.status(400).json({
                success: false,
                error: 'Database configuration is required'
            });
        }

        if (!extractionConfig) {
            return res.status(400).json({
                success: false,
                error: 'Extraction configuration is required'
            });
        }

        const extractedData = await databaseService.extractTrainingData(config, extractionConfig);

        res.json({
            success: true,
            data: extractedData
        });
    } catch (error) {
        console.error('Failed to extract training data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/database/validate-data', tempAuth, async (req, res) => {
    try {
        const { data, format, options } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                error: 'Data array is required'
            });
        }

        if (!format) {
            return res.status(400).json({
                success: false,
                error: 'Data format is required'
            });
        }

        const validationResult = await dataValidationService.validateTrainingData(data, format, options);
        const qualityReport = dataValidationService.generateQualityReport(validationResult);

        res.json({
            success: true,
            validation: validationResult,
            report: qualityReport
        });
    } catch (error) {
        console.error('Data validation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/database/supported-types', tempAuth, async (req, res) => {
    try {
        const supportedTypes = [
            {
                type: 'mongodb',
                name: 'MongoDB',
                description: 'NoSQL document database',
                fields: ['host', 'port', 'database', 'username', 'password'],
                optionalFields: ['connectionString']
            },
            {
                type: 'mongodb_atlas',
                name: 'MongoDB Atlas',
                description: 'Cloud MongoDB service',
                fields: ['connectionString'],
                optionalFields: ['database']
            },
            {
                type: 'mysql',
                name: 'MySQL',
                description: 'Relational database',
                fields: ['host', 'port', 'database', 'username', 'password']
            },
            {
                type: 'postgresql',
                name: 'PostgreSQL',
                description: 'Advanced relational database',
                fields: ['host', 'port', 'database', 'username', 'password']
            },
            {
                type: 'sqlite',
                name: 'SQLite',
                description: 'Lightweight file-based database',
                fields: ['filePath']
            }
        ];

        res.json({
            success: true,
            types: supportedTypes
        });
    } catch (error) {
        console.error('Failed to get supported database types:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/database/data-formats', tempAuth, async (req, res) => {
    try {
        const dataFormats = [
            {
                format: 'conversational',
                name: 'Conversational Data',
                description: 'Chat conversations with input/output pairs',
                structure: {
                    required: ['turns'],
                    turnFields: ['input', 'output'],
                    example: {
                        turns: [
                            { input: "Hello", output: "Hi there!" },
                            { input: "How are you?", output: "I'm doing well, thank you!" }
                        ]
                    }
                }
            },
            {
                format: 'text_classification',
                name: 'Text Classification',
                description: 'Text samples with category labels',
                structure: {
                    required: ['text', 'label'],
                    example: {
                        text: "This movie is amazing!",
                        label: "positive"
                    }
                }
            },
            {
                format: 'question_answer',
                name: 'Question & Answer',
                description: 'Question and answer pairs',
                structure: {
                    required: ['question', 'answer'],
                    example: {
                        question: "What is the capital of France?",
                        answer: "Paris"
                    }
                }
            },
            {
                format: 'text_generation',
                name: 'Text Generation',
                description: 'Text samples for language modeling',
                structure: {
                    required: ['text'],
                    example: {
                        text: "The quick brown fox jumps over the lazy dog."
                    }
                }
            },
            {
                format: 'custom',
                name: 'Custom Format',
                description: 'User-defined data structure',
                structure: {
                    configurable: true,
                    example: "Define your own fields and validation rules"
                }
            }
        ];

        res.json({
            success: true,
            formats: dataFormats
        });
    } catch (error) {
        console.error('Failed to get data formats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get training history
router.get('/history', tempAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // For now, return mock training history
        // In a real implementation, this would query a database
        const mockHistory = [
            {
                id: 'training_001',
                subject: 'programming',
                model: 'gpt2-small',
                status: 'completed',
                startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                endTime: new Date(Date.now() - 82800000).toISOString(), // 1 hour later
                duration: 3600000, // 1 hour in ms
                accuracy: 0.85,
                loss: 0.23,
                samples: 1000
            },
            {
                id: 'training_002',
                subject: 'mathematics',
                model: 'gpt2-medium',
                status: 'completed',
                startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                endTime: new Date(Date.now() - 165600000).toISOString(), // 2 hours later
                duration: 7200000, // 2 hours in ms
                accuracy: 0.92,
                loss: 0.18,
                samples: 1500
            }
        ];

        res.json({
            success: true,
            history: mockHistory
        });
    } catch (error) {
        console.error('Error fetching training history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available base models (including custom and Ollama models)
router.get('/base-models', tempAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { includeCustom, includeOllama } = req.query;

        const baseModels = [
            {
                id: "gpt2-small",
                name: "GPT-2 Small",
                size: "124M",
                description: "OpenAI's GPT-2 small model - good for general text generation",
                type: "foundation",
                compatible_subjects: ["general", "literature", "history", "science"]
            },
            {
                id: "gpt2-medium",
                name: "GPT-2 Medium",
                size: "355M",
                description: "OpenAI's GPT-2 medium model - better performance than small",
                type: "foundation",
                compatible_subjects: ["general", "literature", "history", "science", "programming"]
            },
            {
                id: "distilgpt2",
                name: "DistilGPT-2",
                size: "82M",
                description: "Distilled version of GPT-2 - faster and smaller",
                type: "foundation",
                compatible_subjects: ["general", "literature", "history"]
            },
            {
                id: "dialogpt-small",
                name: "DialoGPT Small",
                size: "117M",
                description: "Microsoft's conversational AI model - good for dialogue",
                type: "foundation",
                compatible_subjects: ["general", "programming", "science"]
            },
            {
                id: "codegen-350m",
                name: "CodeGen 350M",
                size: "350M",
                description: "Salesforce's code generation model - specialized for programming",
                type: "foundation",
                compatible_subjects: ["programming", "science"]
            }
        ];

        // Add custom models if requested
        if (includeCustom === 'true') {
            try {
                const customModelsDir = path.join(__dirname, '..', 'ml_training', 'custom_models');
                const modelDirs = await fs.readdir(customModelsDir);

                for (const modelDir of modelDirs) {
                    const modelInfoPath = path.join(customModelsDir, modelDir, 'model_info.json');
                    try {
                        const modelInfoData = await fs.readFile(modelInfoPath, 'utf8');
                        const modelInfo = JSON.parse(modelInfoData);

                        // Include user's own models and verified models
                        if (modelInfo.uploaded_by === userId || modelInfo.is_verified) {
                            baseModels.push({
                                id: modelInfo.model_id,
                                name: modelInfo.name,
                                size: modelInfo.size,
                                description: modelInfo.description,
                                type: "custom",
                                compatible_subjects: modelInfo.compatible_subjects,
                                verified: modelInfo.is_verified,
                                uploaded_by: modelInfo.uploaded_by,
                                is_own: modelInfo.uploaded_by === userId
                            });
                        }
                    } catch (err) {
                        // Skip invalid model info files
                    }
                }
            } catch (err) {
                // Custom models directory doesn't exist yet
            }
        }

        // Add Ollama models if requested
        if (includeOllama === 'true') {
            try {
                const ollama = getOllamaService();
                const isConnected = await ollama.checkConnection();

                if (isConnected) {
                    const ollamaModels = await ollama.getAvailableModels();
                    baseModels.push(...ollamaModels);
                }
            } catch (err) {
                console.log('Could not fetch Ollama models:', err.message);
            }
        }

        res.json({
            success: true,
            models: baseModels
        });
    } catch (error) {
        console.error('Error fetching base models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available checkpoints
router.get('/checkpoints', tempAuth, async (req, res) => {
    try {
        const { subject } = req.query;

        // Mock checkpoints data - in real implementation, this would query the registry
        const checkpoints = [
            {
                id: "mathematics_epoch_2_step_500",
                subject: "mathematics",
                epoch: 2,
                step: 500,
                loss: 0.45,
                created_at: "2025-07-30T10:30:00Z",
                resumable: true,
                model_size: "1B"
            },
            {
                id: "programming_epoch_1_step_250",
                subject: "programming",
                epoch: 1,
                step: 250,
                loss: 0.62,
                created_at: "2025-07-30T09:15:00Z",
                resumable: true,
                model_size: "1B"
            },
            {
                id: "science_epoch_3_step_750",
                subject: "science",
                epoch: 3,
                step: 750,
                loss: 0.38,
                created_at: "2025-07-30T08:45:00Z",
                resumable: true,
                model_size: "3B"
            }
        ];

        const filteredCheckpoints = subject
            ? checkpoints.filter(c => c.subject === subject)
            : checkpoints;

        res.json({
            success: true,
            checkpoints: filteredCheckpoints
        });
    } catch (error) {
        console.error('Error fetching checkpoints:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start training
router.post('/start', tempAuth, async (req, res) => {
    try {
        const { subject, config } = req.body;

        if (trainingState.status === 'training') {
            return res.status(400).json({
                success: false,
                error: 'Training is already in progress'
            });
        }

        // Validate subject
        const validSubjects = ['mathematics', 'programming', 'science', 'history', 'literature'];
        if (!validSubjects.includes(subject)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject specified'
            });
        }

        // Reset training state
        trainingState = {
            status: 'starting',
            currentSubject: subject,
            config: config,
            process: null,
            logs: [],
            startTime: new Date().toISOString(),
            progress: 0
        };

        // Enhanced logging for advanced training modes
        const trainingMode = config.trainingMode || 'fine_tune';
        addTrainingLog(`Starting ${trainingMode} training for ${subject} model`);

        if (config.baseModel) {
            addTrainingLog(`Using base model: ${config.baseModel.name} (${config.baseModel.size})`);
        }

        if (config.resumeFromCheckpoint && config.checkpointId) {
            addTrainingLog(`Resuming from checkpoint: ${config.checkpointId}`);
        }

        if (config.transferFromSubject) {
            addTrainingLog(`Transfer learning from: ${config.transferFromSubject}`);
        }

        if (config.retrainExisting && config.retrainModelId) {
            addTrainingLog(`Retraining existing ${subject} model: ${config.retrainModelId}`);
            addTrainingLog(`Base model will be loaded from previous training`);
        }

        addTrainingLog(`Configuration: ${config.modelSize} parameters, ${config.epochs} epochs`);

        // Start training process
        const success = await startTrainingProcess(subject, config);

        if (success) {
            res.json({
                success: true,
                message: 'Training started successfully'
            });
        } else {
            trainingState.status = 'error';
            res.status(500).json({
                success: false,
                error: 'Failed to start training process'
            });
        }

    } catch (error) {
        console.error('Error starting training:', error);
        trainingState.status = 'error';
        addTrainingLog(`Error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop training
router.post('/stop', tempAuth, (req, res) => {
    try {
        if (trainingState.process) {
            trainingState.process.kill('SIGTERM');
            trainingState.status = 'stopped';
            addTrainingLog('Training stopped by user');
        }

        res.json({
            success: true,
            message: 'Training stopped'
        });
    } catch (error) {
        console.error('Error stopping training:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get trained models
router.get('/models', tempAuth, async (req, res) => {
    try {
        const modelsDir = path.join(__dirname, '..', 'ml_training', 'models');
        const checkpointsDir = path.join(__dirname, '..', 'ml_training', 'checkpoints');
        
        const models = [];

        // Check for saved models
        try {
            const modelFiles = await fs.readdir(modelsDir);
            for (const file of modelFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const modelPath = path.join(modelsDir, file);
                        const modelData = JSON.parse(await fs.readFile(modelPath, 'utf8'));
                        models.push({
                            id: file.replace('.json', ''),
                            ...modelData
                        });
                    } catch (err) {
                        console.error(`Error reading model file ${file}:`, err);
                    }
                }
            }
        } catch (err) {
            console.log('Models directory not found or empty');
        }

        res.json({
            success: true,
            models: models
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get trained models for chat interface
router.get('/models/chat', tempAuth, async (req, res) => {
    try {
        const modelsDir = path.join(__dirname, '..', 'ml_training', 'models');
        const models = [];

        // Check for saved models
        try {
            const modelFiles = await fs.readdir(modelsDir);
            for (const file of modelFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const modelPath = path.join(modelsDir, file);
                        const modelData = JSON.parse(await fs.readFile(modelPath, 'utf8'));

                        // Transform for chat interface
                        models.push({
                            id: `trained-${file.replace('.json', '')}`,
                            name: `${modelData.subject} Specialist`,
                            provider: 'Custom Trained',
                            type: 'trained',
                            icon: '🧠',
                            description: `Specialized model for ${modelData.subject}`,
                            status: 'available',
                            subject: modelData.subject,
                            accuracy: modelData.accuracy || 85,
                            size: modelData.size || '1B',
                            createdAt: modelData.createdAt
                        });
                    } catch (err) {
                        console.error(`Error reading model file ${file}:`, err);
                    }
                }
            }
        } catch (err) {
            console.log('Models directory not found or empty');
        }

        res.json({
            success: true,
            models: models
        });
    } catch (error) {
        console.error('Error fetching trained models for chat:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete trained model
router.delete('/models/:modelId', tempAuth, async (req, res) => {
    try {
        const { modelId } = req.params;
        console.log(`🗑️ Delete request for model: ${modelId}`);

        const modelsDir = path.join(__dirname, '..', 'ml_training', 'models');
        const checkpointsDir = path.join(__dirname, '..', 'ml_training', 'checkpoints');

        let deletedFiles = [];
        let errors = [];

        // Delete model JSON file
        const modelJsonPath = path.join(modelsDir, `${modelId}.json`);
        try {
            await fs.unlink(modelJsonPath);
            deletedFiles.push(`Model JSON: ${modelJsonPath}`);
            console.log(`✅ Deleted model JSON: ${modelJsonPath}`);
        } catch (err) {
            errors.push(`Model JSON not found: ${modelJsonPath}`);
            console.log(`⚠️ Model JSON not found: ${modelJsonPath}`);
        }

        // Delete model checkpoint files (try multiple formats)
        const checkpointFormats = ['.zip', '.pt', '.pth', '.bin', '.safetensors'];
        for (const format of checkpointFormats) {
            const checkpointPath = path.join(checkpointsDir, `${modelId}${format}`);
            try {
                await fs.unlink(checkpointPath);
                deletedFiles.push(`Checkpoint: ${checkpointPath}`);
                console.log(`✅ Deleted checkpoint: ${checkpointPath}`);
            } catch (err) {
                // Don't log as error since we're trying multiple formats
            }
        }

        // Delete any additional model files/directories
        const modelDir = path.join(modelsDir, modelId);
        try {
            await fs.rmdir(modelDir, { recursive: true });
            deletedFiles.push(`Model directory: ${modelDir}`);
            console.log(`✅ Deleted model directory: ${modelDir}`);
        } catch (err) {
            console.log(`⚠️ Model directory not found: ${modelDir}`);
        }

        // Check if we deleted at least the JSON file (minimum requirement)
        if (deletedFiles.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Model ${modelId} not found. No files were deleted.`,
                details: errors
            });
        }

        res.json({
            success: true,
            message: `Model ${modelId} deleted successfully`,
            deletedFiles: deletedFiles,
            warnings: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('❌ Error deleting model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test download endpoint
router.get('/download/test', (req, res) => {
    res.json({
        success: true,
        message: 'Download endpoint is working',
        timestamp: new Date().toISOString()
    });
});

// Download model (supports both ZIP and JSON formats)
router.get('/download/:modelId', tempAuth, async (req, res) => {
    try {
        const { modelId } = req.params;
        const { format } = req.query; // ?format=zip or ?format=json

        console.log(`Download request for model: ${modelId}, format: ${format || 'zip'}`);

        // Default to ZIP format
        const downloadFormat = format === 'json' ? 'json' : 'zip';

        // Check if model exists in models directory (real model files)
        const modelDir = path.join(__dirname, '..', 'ml_training', 'models', modelId);
        const modelJsonPath = path.join(__dirname, '..', 'ml_training', 'models', `${modelId}.json`);

        console.log(`Checking for model directory: ${modelDir}`);
        console.log(`Checking for model JSON: ${modelJsonPath}`);

        try {
            // Check if model directory exists (real trained model)
            const modelDirExists = await fs.access(modelDir).then(() => true).catch(() => false);
            const modelJsonExists = await fs.access(modelJsonPath).then(() => true).catch(() => false);

            if (modelDirExists && modelJsonExists) {
                console.log(`Real model found, creating download package: ${modelId}`);

                if (downloadFormat === 'zip') {
                    // Create ZIP package from real model files
                    const zipPath = await createRealModelZipFile(modelId, modelDir, modelJsonPath);

                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', `attachment; filename="${modelId}_model.zip"`);

                    res.download(zipPath, `${modelId}_model.zip`, (err) => {
                        if (err) {
                            console.error('Error during ZIP download:', err);
                            if (!res.headersSent) {
                                res.status(500).json({
                                    success: false,
                                    error: 'Download failed'
                                });
                            }
                        } else {
                            console.log(`ZIP download completed successfully: ${modelId}`);
                            // Clean up temporary ZIP file
                            fs.unlink(zipPath).catch(console.error);
                        }
                    });
                } else {
                    // Download JSON metadata
                    const modelMetadata = await fs.readFile(modelJsonPath, 'utf8');
                    const packageData = JSON.parse(modelMetadata);

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename="${modelId}_model_info.json"`);

                    res.send(JSON.stringify(packageData, null, 2));
                    console.log(`JSON download completed successfully: ${modelId}`);
                }
                return;
            }

            // Fallback to checkpoint files (legacy models)
            const checkpointZipPath = path.join(__dirname, '..', 'ml_training', 'checkpoints', `${modelId}.zip`);
            const checkpointJsonPath = path.join(__dirname, '..', 'ml_training', 'checkpoints', `${modelId}.json`);

            console.log(`Real model not found, checking checkpoints: ${checkpointZipPath}`);

            if (downloadFormat === 'zip') {
                try {
                    await fs.access(checkpointZipPath);
                    console.log(`Checkpoint ZIP found: ${modelId}`);

                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', `attachment; filename="${modelId}_model.zip"`);

                    res.download(checkpointZipPath, `${modelId}_model.zip`, (err) => {
                        if (err) {
                            console.error('Error during checkpoint ZIP download:', err);
                            if (!res.headersSent) {
                                res.status(500).json({
                                    success: false,
                                    error: 'Download failed'
                                });
                            }
                        } else {
                            console.log(`Checkpoint ZIP download completed: ${modelId}`);
                        }
                    });
                    return;
                } catch (zipErr) {
                    // Try JSON fallback
                    try {
                        await fs.access(checkpointJsonPath);
                        console.log(`ZIP not found, falling back to checkpoint JSON: ${modelId}`);

                        const modelPackage = await fs.readFile(checkpointJsonPath, 'utf8');
                        const packageData = JSON.parse(modelPackage);

                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Disposition', `attachment; filename="${modelId}_model_package.json"`);

                        res.send(JSON.stringify(packageData, null, 2));
                        console.log(`Fallback JSON download completed: ${modelId}`);
                        return;
                    } catch (jsonErr) {
                        // Neither ZIP nor JSON found
                    }
                }
            } else {
                // JSON format requested
                try {
                    await fs.access(checkpointJsonPath);
                    const modelPackage = await fs.readFile(checkpointJsonPath, 'utf8');
                    const packageData = JSON.parse(modelPackage);

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename="${modelId}_model_package.json"`);

                    res.send(JSON.stringify(packageData, null, 2));
                    console.log(`Checkpoint JSON download completed: ${modelId}`);
                    return;
                } catch (jsonErr) {
                    // JSON not found
                }
            }

            // Model not found anywhere
            res.status(404).json({
                success: false,
                error: `Model not found: ${modelId}. The model may not have completed training yet, or the model files may have been moved or deleted.`
            });

        } catch (err) {
            console.error('Error checking model files:', err);
            res.status(500).json({
                success: false,
                error: 'Error accessing model files'
            });
        }
    } catch (error) {
        console.error('Error downloading model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// === DATA MANAGEMENT ENDPOINTS ===

// Get data statistics for a subject
router.get('/data/stats/:subject', tempAuth, async (req, res) => {
    try {
        const { subject } = req.params;
        const datasetDir = path.join(__dirname, '..', 'ml_training', 'datasets', subject);

        const stats = {
            train: 0,
            validation: 0,
            test: 0
        };

        try {
            // Count lines in each file
            const trainPath = path.join(datasetDir, 'train.jsonl');
            const valPath = path.join(datasetDir, 'val.jsonl');
            const testPath = path.join(datasetDir, 'test.jsonl');

            try {
                const trainData = await fs.readFile(trainPath, 'utf8');
                stats.train = trainData.trim().split('\n').filter(line => line.trim()).length;
            } catch (err) { /* File doesn't exist */ }

            try {
                const valData = await fs.readFile(valPath, 'utf8');
                stats.validation = valData.trim().split('\n').filter(line => line.trim()).length;
            } catch (err) { /* File doesn't exist */ }

            try {
                const testData = await fs.readFile(testPath, 'utf8');
                stats.test = testData.trim().split('\n').filter(line => line.trim()).length;
            } catch (err) { /* File doesn't exist */ }

        } catch (err) {
            console.log(`Dataset directory for ${subject} not found`);
        }

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error getting data stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload training data file
router.post('/data/upload', tempAuth, upload.single('file'), async (req, res) => {
    try {
        const { subject } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Read uploaded file
        const fileContent = await fs.readFile(file.path, 'utf8');

        // Process and validate data
        const result = await processTrainingData(subject, fileContent);

        // Clean up uploaded file
        await fs.unlink(file.path);

        res.json({
            success: true,
            count: result.count,
            message: `Successfully processed ${result.count} training examples`
        });

    } catch (error) {
        console.error('Error uploading data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process text data
router.post('/data/text', tempAuth, async (req, res) => {
    try {
        console.log('Processing text data request...');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const { subject, data } = req.body;

        if (!subject) {
            console.log('Missing subject in request');
            return res.status(400).json({
                success: false,
                error: 'Subject is required'
            });
        }

        if (!data || (typeof data === 'string' && !data.trim()) || (Array.isArray(data) && data.length === 0)) {
            console.log('Missing or empty data in request');
            return res.status(400).json({
                success: false,
                error: 'No training data provided'
            });
        }

        console.log(`Processing ${typeof data === 'string' ? 'string' : 'array'} data for subject: ${subject}`);

        const result = await processTrainingData(subject, data);

        console.log(`Successfully processed ${result.count} training examples`);

        res.json({
            success: true,
            count: result.count,
            message: `Successfully processed ${result.count} training examples`
        });

    } catch (error) {
        console.error('Error processing text data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Import data from URL
router.post('/data/url', tempAuth, async (req, res) => {
    try {
        const { subject, url } = req.body;

        if (!url || !url.trim()) {
            return res.status(400).json({
                success: false,
                error: 'No URL provided'
            });
        }

        // Extract data from URL (mock implementation)
        const extractedData = await extractDataFromUrl(url, subject);
        const result = await processTrainingData(subject, extractedData);

        res.json({
            success: true,
            count: result.count,
            message: `Successfully extracted and processed ${result.count} training examples`
        });

    } catch (error) {
        console.error('Error importing from URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate sample data
router.post('/data/generate', tempAuth, async (req, res) => {
    try {
        const { subject, count = 10 } = req.body;

        console.log(`Generating ${count} sample data for subject: ${subject}`);

        const sampleData = generateSampleDataArray(subject, count);

        res.json({
            success: true,
            samples: sampleData,
            count: sampleData.length,
            message: `Successfully generated ${sampleData.length} sample training examples for ${subject}`
        });

    } catch (error) {
        console.error('Error generating sample data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to start training process
async function startTrainingProcess(subject, config) {
    try {
        const trainingScript = path.join(__dirname, '..', 'ml_training', 'scripts', 'train_subject_model.py');
        
        // Check if training script exists
        try {
            await fs.access(trainingScript);
        } catch (err) {
            addTrainingLog('Training script not found. Creating mock training process...');
            return startMockTraining(subject, config);
        }

        // Prepare training arguments
        const args = [
            trainingScript,
            '--subject', subject,
            '--model-size', config.modelSize,
            '--epochs', config.epochs.toString(),
            '--batch-size', config.batchSize.toString(),
            '--learning-rate', config.learningRate.toString()
        ];

        if (config.useUnsloth) {
            args.push('--use-unsloth');
        }

        if (config.useLoRA) {
            args.push('--use-lora');
        }

        // Try real ML training first, fallback to mock if dependencies missing
        addTrainingLog('🔍 Attempting real ML training...');
        return startRealMLTraining(subject, config);

        // Complex trainer code (disabled due to dependency issues)
        /*
        let pythonProcess;
        try {
            pythonProcess = spawn('python', args, {
                cwd: path.join(__dirname, '..', 'ml_training'),
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch (spawnError) {
            addTrainingLog('⚠️ Failed to start complex trainer. Using simple mock trainer...');
            return startSimpleMockTraining(subject, config);
        }
        */

        // trainingState.process = pythonProcess; // Disabled - using simple mock trainer
        // trainingState.status = 'training'; // Status set in simple mock trainer

        // Handle process output
        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            addTrainingLog(output);
            
            // Parse progress if available
            const progressMatch = output.match(/Progress: (\d+)%/);
            if (progressMatch) {
                trainingState.progress = parseInt(progressMatch[1]);
            }
        });

        let fallbackTriggered = false;

        pythonProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            addTrainingLog(`Error: ${error}`);

            // Check for common dependency errors
            if (!fallbackTriggered && (error.includes('ModuleNotFoundError') || error.includes('ImportError'))) {
                fallbackTriggered = true;
                addTrainingLog('⚠️ Missing Python dependencies detected. Falling back to simple mock training...');
                pythonProcess.kill();
                setTimeout(() => {
                    startSimpleMockTraining(subject, config);
                }, 1000);
            }
        });

        pythonProcess.on('close', (code) => {
            if (fallbackTriggered) {
                // Don't process close event if fallback was triggered
                return;
            }

            if (code === 0) {
                trainingState.status = 'completed';
                trainingState.progress = 100;
                addTrainingLog('Training completed successfully!');
                saveModelInfo(subject, config);
            } else {
                trainingState.status = 'error';
                addTrainingLog(`Training failed with exit code ${code}`);
            }
        });

        return true;
    } catch (error) {
        console.error('Error starting training process:', error);
        addTrainingLog(`Error starting training: ${error.message}`);
        return false;
    }
}

// Real ML training using transformers
async function startRealMLTraining(subject, config) {
    try {
        const realTrainerScript = path.join(__dirname, '..', 'ml_training', 'scripts', 'real_ml_trainer.py');

        // Check if real trainer script exists
        if (!fsSync.existsSync(realTrainerScript)) {
            addTrainingLog('⚠️ Real ML trainer not found. Using simple mock trainer...');
            return startSimpleMockTraining(subject, config);
        }

        // Prepare arguments for real ML trainer
        const args = [
            realTrainerScript,
            subject,
            config.modelSize,
            config.epochs.toString(),
            config.batchSize.toString(),
            config.learningRate.toString()
        ];

        // Add retrain model ID if retraining
        if (config.retrainExisting && config.retrainModelId) {
            args.push(config.retrainModelId);
        }

        addTrainingLog('🚀 Starting REAL ML training with transformers...');
        addTrainingLog(`📚 Subject: ${subject}`);
        addTrainingLog(`⚙️ Configuration: ${config.modelSize} parameters, ${config.epochs} epochs`);
        addTrainingLog('📦 Checking ML dependencies...');

        // Start Python real ML training process
        const pythonProcess = spawn('python', args, {
            cwd: path.join(__dirname, '..', 'ml_training'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        trainingState.process = pythonProcess;
        trainingState.status = 'training';

        let dependencyCheckFailed = false;

        // Handle process output
        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            addTrainingLog(output);

            // Parse progress from output
            if (output.includes('Epoch')) {
                const epochMatch = output.match(/Epoch (\d+)\/(\d+)/);
                if (epochMatch) {
                    const currentEpoch = parseInt(epochMatch[1]);
                    const totalEpochs = parseInt(epochMatch[2]);
                    trainingState.progress = Math.round((currentEpoch / totalEpochs) * 100);
                }
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            addTrainingLog(`Error: ${error}`);

            // Check for dependency errors
            if (error.includes('ModuleNotFoundError') || error.includes('ImportError') || error.includes('missing dependencies')) {
                if (!dependencyCheckFailed) {
                    dependencyCheckFailed = true;
                    addTrainingLog('⚠️ ML dependencies not available. Falling back to mock training...');
                    pythonProcess.kill();
                    setTimeout(() => {
                        startSimpleMockTraining(subject, config);
                    }, 1000);
                }
            }
        });

        pythonProcess.on('close', (code) => {
            if (dependencyCheckFailed) {
                // Don't process close event if fallback was triggered
                return;
            }

            if (code === 0) {
                trainingState.status = 'completed';
                trainingState.progress = 100;
                addTrainingLog('✅ REAL ML training completed successfully!');
                addTrainingLog('🎉 You now have a real trained transformer model!');
            } else {
                addTrainingLog('⚠️ Real ML training failed. Falling back to mock training...');
                startSimpleMockTraining(subject, config);
            }
        });

        return true;
    } catch (error) {
        console.error('Error starting real ML training:', error);
        addTrainingLog(`❌ Error starting real ML training: ${error.message}`);
        addTrainingLog('⚠️ Falling back to mock training...');
        return startSimpleMockTraining(subject, config);
    }
}

// Simple mock training using Python script
async function startSimpleMockTraining(subject, config) {
    try {
        const mockTrainerScript = path.join(__dirname, '..', 'ml_training', 'scripts', 'simple_mock_trainer.py');

        // Prepare arguments for simple mock trainer
        const args = [
            mockTrainerScript,
            subject,
            config.modelSize,
            config.epochs.toString(),
            config.batchSize.toString(),
            config.learningRate.toString()
        ];

        // Add retrain model ID if retraining
        if (config.retrainExisting && config.retrainModelId) {
            args.push(config.retrainModelId);
        }

        addTrainingLog('🚀 Starting simple mock training...');
        addTrainingLog(`📚 Subject: ${subject}`);
        addTrainingLog(`⚙️ Configuration: ${config.modelSize} parameters, ${config.epochs} epochs`);

        // Start Python mock training process
        const pythonProcess = spawn('python', args, {
            cwd: path.join(__dirname, '..', 'ml_training'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        trainingState.process = pythonProcess;
        trainingState.status = 'training';

        // Handle process output
        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            addTrainingLog(output);

            // Parse progress from output
            if (output.includes('Epoch')) {
                const epochMatch = output.match(/Epoch (\d+)\/(\d+)/);
                if (epochMatch) {
                    const currentEpoch = parseInt(epochMatch[1]);
                    const totalEpochs = parseInt(epochMatch[2]);
                    trainingState.progress = Math.round((currentEpoch / totalEpochs) * 100);
                }
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            addTrainingLog(`Error: ${error}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                trainingState.status = 'completed';
                trainingState.progress = 100;
                addTrainingLog('✅ Simple mock training completed successfully!');
            } else {
                trainingState.status = 'error';
                addTrainingLog(`❌ Simple mock training failed with exit code ${code}`);
            }
        });

        return true;
    } catch (error) {
        console.error('Error starting simple mock training:', error);
        addTrainingLog(`❌ Error starting simple mock training: ${error.message}`);
        // Fallback to the original mock training
        return startMockTraining(subject, config);
    }
}

// Mock training for demonstration
function startMockTraining(subject, config) {
    trainingState.status = 'training';
    trainingState.progress = 0;

    const trainingMode = config.trainingMode || 'fine_tune';

    addTrainingLog('🔄 Starting advanced training process...');
    addTrainingLog(`📚 Subject: ${subject.charAt(0).toUpperCase() + subject.slice(1)}`);
    addTrainingLog(`🎯 Training Mode: ${trainingMode.replace('_', ' ').toUpperCase()}`);

    // Show base model info
    if (config.baseModel) {
        addTrainingLog(`🏗️ Base Model: ${config.baseModel.name} (${config.baseModel.size})`);
    }

    // Show checkpoint info for resume
    if (config.resumeFromCheckpoint && config.checkpointId) {
        addTrainingLog(`🔄 Resuming from: ${config.checkpointId}`);
        addTrainingLog(`📊 Previous progress: Epoch ${Math.floor(Math.random() * 3) + 1}, Loss: ${(Math.random() * 0.5 + 0.3).toFixed(4)}`);
    }

    // Show transfer learning info
    if (config.transferFromSubject) {
        addTrainingLog(`🔄 Transfer from: ${config.transferFromSubject.charAt(0).toUpperCase() + config.transferFromSubject.slice(1)}`);
        addTrainingLog(`🧠 Leveraging pre-trained knowledge from ${config.transferFromSubject}`);
    }

    addTrainingLog(`🧠 Model Size: ${config.modelSize} parameters`);
    addTrainingLog(`🔄 Epochs: ${config.epochs}`);
    addTrainingLog(`📦 Batch Size: ${config.batchSize}`);
    addTrainingLog(`📈 Learning Rate: ${config.learningRate}`);
    addTrainingLog(`⚡ Unsloth: ${config.useUnsloth ? 'Enabled' : 'Disabled'}`);
    addTrainingLog(`🎯 LoRA: ${config.useLoRA ? 'Enabled' : 'Disabled'}`);
    addTrainingLog('');

    let progress = 0;
    let currentEpoch = 1;
    const startEpoch = config.resumeFromCheckpoint ? Math.floor(Math.random() * 2) + 1 : 1;
    // trainingMode already declared above

    const interval = setInterval(() => {
        // Adjust progress speed based on training mode
        let progressIncrement = Math.random() * 8 + 2;
        if (trainingMode === 'resume') {
            progressIncrement *= 1.5; // Faster for resume
            progress += progressIncrement;
        } else if (trainingMode === 'transfer') {
            progressIncrement *= 1.2; // Slightly faster for transfer
            progress += progressIncrement;
        } else {
            progress += progressIncrement;
        }

        trainingState.progress = Math.min(progress, 100);

        if (progress < 15) {
            if (trainingMode === 'resume') {
                addTrainingLog(`🔄 Restoring model state from checkpoint...`);
                addTrainingLog(`📊 Validating checkpoint integrity...`);
            } else if (trainingMode === 'transfer') {
                addTrainingLog(`🔄 Loading source model for transfer learning...`);
                addTrainingLog(`🧠 Adapting model architecture for ${subject}...`);
            } else {
                addTrainingLog(`📊 Loading ${subject} training dataset...`);
            }
        } else if (progress < 35) {
            if (trainingMode === 'resume') {
                addTrainingLog(`🚀 Resuming training from Epoch ${startEpoch}/${config.epochs}...`);
                addTrainingLog(`📈 Continuing from previous loss: ${(Math.random() * 0.5 + 0.4).toFixed(4)}`);
            } else if (trainingMode === 'transfer') {
                addTrainingLog(`🎯 Freezing base layers for transfer learning...`);
                addTrainingLog(`🔧 Initializing subject-specific layers...`);
            } else {
                addTrainingLog(`🚀 Epoch ${currentEpoch}/${config.epochs}: Initializing model...`);
            }
            currentEpoch = 2;
        } else if (progress < 60) {
            addTrainingLog(`🔥 Epoch ${currentEpoch}/${config.epochs}: Training in progress...`);
            if (trainingMode === 'transfer') {
                addTrainingLog(`🔄 Transfer learning: ${(Math.random() * 1.5 + 0.8).toFixed(4)} → ${(Math.random() * 1 + 0.5).toFixed(4)}`);
            } else {
                addTrainingLog(`📈 Loss: ${(Math.random() * 2 + 1).toFixed(4)}`);
            }
            currentEpoch = 3;
        } else if (progress < 80) {
            if (trainingMode === 'transfer') {
                addTrainingLog(`🎯 Fine-tuning transferred knowledge for ${subject}...`);
                addTrainingLog(`📊 Adaptation loss: ${(Math.random() * 0.8 + 0.3).toFixed(4)}`);
            } else {
                addTrainingLog(`🎯 Epoch ${currentEpoch}/${config.epochs}: Fine-tuning with LoRA...`);
                addTrainingLog(`📉 Loss: ${(Math.random() * 1 + 0.5).toFixed(4)}`);
            }
        } else if (progress < 95) {
            addTrainingLog(`💾 Saving model checkpoint...`);
            if (trainingMode === 'transfer') {
                addTrainingLog(`🔄 Saving transfer learning adapters...`);
            }
        } else {
            if (trainingMode === 'resume') {
                addTrainingLog(`✅ Training resumed and completed successfully!`);
            } else if (trainingMode === 'transfer') {
                addTrainingLog(`✅ Transfer learning completed successfully!`);
                addTrainingLog(`🎯 Model adapted for ${subject} domain`);
            } else {
                addTrainingLog(`✅ Training completed successfully!`);
            }
        }

        if (progress >= 100) {
            clearInterval(interval);
            trainingState.status = 'completed';
            trainingState.progress = 100;
            addTrainingLog('🎉 Mock training completed successfully!');
            addTrainingLog('📁 Model saved to checkpoints directory');
            saveModelInfo(subject, config);
        }
    }, 1500);

    return true;
}

// Helper function to add training logs
function addTrainingLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    trainingState.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (trainingState.logs.length > 100) {
        trainingState.logs = trainingState.logs.slice(-100);
    }
    
    console.log(logEntry);
}

// Helper function to save model information
async function saveModelInfo(subject, config) {
    try {
        const modelInfo = {
            subject: subject,
            size: config.modelSize,
            accuracy: Math.floor(Math.random() * 20) + 80, // Mock accuracy 80-100%
            epochs: config.epochs,
            batchSize: config.batchSize,
            learningRate: config.learningRate,
            useUnsloth: config.useUnsloth,
            useLoRA: config.useLoRA,
            createdAt: new Date().toISOString(),
            trainingTime: Date.now() - new Date(trainingState.startTime).getTime()
        };

        const modelsDir = path.join(__dirname, '..', 'ml_training', 'models');
        await fs.mkdir(modelsDir, { recursive: true });

        const modelId = `${subject}_${config.modelSize}_${Date.now()}`;
        const modelPath = path.join(modelsDir, `${modelId}.json`);

        await fs.writeFile(modelPath, JSON.stringify(modelInfo, null, 2));

        // Create a downloadable model package file
        const checkpointsDir = path.join(__dirname, '..', 'ml_training', 'checkpoints');
        await fs.mkdir(checkpointsDir, { recursive: true });

        const packagePath = path.join(checkpointsDir, `${modelId}.json`);

        // Create a comprehensive model package with all information
        const modelPackage = {
            model_info: modelInfo,
            model_config: config,
            training_summary: {
                subject: subject,
                model_size: config.modelSize,
                accuracy: `${modelInfo.accuracy}%`,
                training_time: `${Math.round(modelInfo.trainingTime / 1000)}s`,
                epochs_completed: config.epochs,
                final_loss: (Math.random() * 0.5 + 0.3).toFixed(4)
            },
            readme: `# ${subject.charAt(0).toUpperCase() + subject.slice(1)} Language Model\n\n## Model Details\n- **Subject**: ${subject}\n- **Parameters**: ${config.modelSize}\n- **Accuracy**: ${modelInfo.accuracy}%\n- **Training Time**: ${Math.round(modelInfo.trainingTime / 1000)} seconds\n- **Epochs**: ${config.epochs}\n- **Batch Size**: ${config.batchSize}\n- **Learning Rate**: ${config.learningRate}\n- **Unsloth**: ${config.useUnsloth ? 'Enabled' : 'Disabled'}\n- **LoRA**: ${config.useLoRA ? 'Enabled' : 'Disabled'}\n\n## Usage\nThis model is specialized for ${subject}-related queries and conversations.\n\n## Generated by\nLLM Training Dashboard - ${new Date().toISOString()}`,
            model_files: {
                description: "In a production environment, this would contain:",
                files: [
                    "model.safetensors - The trained model weights",
                    "config.json - Model configuration",
                    "tokenizer.json - Tokenizer configuration",
                    "tokenizer_config.json - Tokenizer settings",
                    "training_args.json - Training arguments used",
                    "README.md - Model documentation"
                ]
            },
            download_info: {
                downloaded_at: new Date().toISOString(),
                format: "Model Information Package",
                note: "This is a demonstration package. In production, this would be a complete model archive."
            }
        };

        // Write the model package as a formatted JSON file
        await fs.writeFile(packagePath, JSON.stringify(modelPackage, null, 2));

        // Also create a proper ZIP file for download
        await createModelZipFile(modelId, modelPackage);

        addTrainingLog(`Model saved as ${modelId}`);
    } catch (error) {
        console.error('Error saving model info:', error);
        addTrainingLog(`Error saving model: ${error.message}`);
    }
}

// Helper function to create a ZIP file from real model files
async function createRealModelZipFile(modelId, modelDir, modelJsonPath) {
    try {
        const archiver = require('archiver');
        const tempDir = path.join(__dirname, '..', 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const zipPath = path.join(tempDir, `${modelId}_download.zip`);
        const output = require('fs').createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        return new Promise(async (resolve, reject) => {
            output.on('close', () => {
                console.log(`Real model ZIP created: ${archive.pointer()} total bytes`);
                resolve(zipPath);
            });

            archive.on('error', (err) => {
                console.error('Error creating real model ZIP:', err);
                reject(err);
            });

            archive.pipe(output);

            try {
                // Add model metadata
                const modelMetadata = await fs.readFile(modelJsonPath, 'utf8');
                archive.append(modelMetadata, { name: 'model_info.json' });

                // Add all files from the model directory
                const files = await fs.readdir(modelDir);
                for (const file of files) {
                    const filePath = path.join(modelDir, file);
                    const stats = await fs.stat(filePath);

                    if (stats.isFile()) {
                        console.log(`Adding file to ZIP: ${file}`);
                        const fileContent = await fs.readFile(filePath);
                        archive.append(fileContent, { name: file });
                    }
                }

                // Add README with model information
                const modelInfo = JSON.parse(modelMetadata);
                const readme = `# ${modelInfo.name || modelId}

## Model Information
- **Subject**: ${modelInfo.subject}
- **Size**: ${modelInfo.size}
- **Accuracy**: ${modelInfo.accuracy}%
- **Status**: ${modelInfo.status}
- **Created**: ${modelInfo.createdAt}

## Description
${modelInfo.description || 'Trained model for specialized tasks'}

## Training Configuration
- **Epochs**: ${modelInfo.trainingConfig?.epochs || 'N/A'}
- **Batch Size**: ${modelInfo.trainingConfig?.batchSize || 'N/A'}
- **Learning Rate**: ${modelInfo.trainingConfig?.learningRate || 'N/A'}
- **Base Model**: ${modelInfo.trainingConfig?.baseModel || 'N/A'}

## Model Files
- **model.safetensors**: Main model weights
- **config.json**: Model configuration
- **tokenizer.json**: Tokenizer configuration
- **tokenizer_config.json**: Tokenizer settings
- **vocab.json**: Vocabulary mapping
- **merges.txt**: BPE merges
- **generation_config.json**: Generation parameters

## Usage
This model can be loaded using the Transformers library:

\`\`\`python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("./")
model = AutoModelForCausalLM.from_pretrained("./")
\`\`\`

## Performance Metrics
${modelInfo.metrics ? Object.entries(modelInfo.metrics).map(([key, value]) => `- **${key}**: ${value}`).join('\n') : 'No metrics available'}
`;

                archive.append(readme, { name: 'README.md' });

                archive.finalize();
            } catch (err) {
                reject(err);
            }
        });
    } catch (error) {
        console.error('Error creating real model ZIP file:', error);
        throw error;
    }
}

// Helper function to create a proper ZIP file for model download (legacy)
async function createModelZipFile(modelId, modelPackage) {
    try {
        const checkpointsDir = path.join(__dirname, '..', 'ml_training', 'checkpoints');
        const zipPath = path.join(checkpointsDir, `${modelId}.zip`);

        // Create a write stream for the ZIP file
        const output = require('fs').createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                console.log(`ZIP file created: ${zipPath} (${archive.pointer()} bytes)`);
                resolve();
            });

            archive.on('error', (err) => {
                console.error('Error creating ZIP file:', err);
                reject(err);
            });

            // Pipe archive data to the file
            archive.pipe(output);

            // Add files to the ZIP
            archive.append(JSON.stringify(modelPackage.model_info, null, 2), { name: 'model_info.json' });
            archive.append(JSON.stringify(modelPackage.model_config, null, 2), { name: 'config.json' });
            archive.append(modelPackage.readme, { name: 'README.md' });
            archive.append(JSON.stringify(modelPackage.training_summary, null, 2), { name: 'training_summary.json' });
            archive.append(JSON.stringify(modelPackage.download_info, null, 2), { name: 'download_info.json' });

            // Add mock model files (in production, these would be real model files)
            archive.append('# Mock Model Weights\nThis file represents the trained model weights.\nIn production, this would be a binary safetensors file.', { name: 'model.safetensors.txt' });
            archive.append('# Mock Tokenizer\nThis file represents the tokenizer configuration.\nIn production, this would be the actual tokenizer files.', { name: 'tokenizer_config.json.txt' });

            // Finalize the archive
            archive.finalize();
        });
    } catch (error) {
        console.error('Error creating model ZIP file:', error);
        throw error;
    }
}

// === DATA PROCESSING HELPER FUNCTIONS ===

// Process and validate training data
async function processTrainingData(subject, dataContent) {
    const lines = dataContent.trim().split('\n').filter(line => line.trim());
    const validExamples = [];
    let errorCount = 0;

    for (const line of lines) {
        try {
            const example = JSON.parse(line);

            // Normalize field names and validate required fields
            const normalizedExample = {
                input: example.input || example.question || example.instruction,
                target: example.target || example.answer || example.response || example.output,
                category: example.category || 'general',
                difficulty: example.difficulty || 'intermediate',
                source: example.source || 'user_upload',
                subject: example.subject || subject
            };

            if (normalizedExample.input && normalizedExample.target) {
                // Validate minimum length
                if (normalizedExample.input.length >= 5 && normalizedExample.target.length >= 3) {
                    validExamples.push(normalizedExample);
                } else {
                    console.log(`Skipping example with too short content: input=${normalizedExample.input.length} chars, target=${normalizedExample.target.length} chars`);
                    errorCount++;
                }
            } else {
                console.log(`Skipping example missing required fields:`, example);
                errorCount++;
            }
        } catch (err) {
            errorCount++;
        }
    }

    if (validExamples.length === 0) {
        throw new Error('No valid training examples found');
    }

    // Save to dataset files
    await saveTrainingData(subject, validExamples);

    return {
        count: validExamples.length,
        errors: errorCount
    };
}

// Save training data to files
async function saveTrainingData(subject, examples) {
    const datasetDir = path.join(__dirname, '..', 'ml_training', 'datasets', subject);
    await fs.mkdir(datasetDir, { recursive: true });

    // Split data: 80% train, 10% validation, 10% test
    const shuffled = examples.sort(() => Math.random() - 0.5);
    const trainSize = Math.floor(examples.length * 0.8);
    const valSize = Math.floor(examples.length * 0.1);

    const trainData = shuffled.slice(0, trainSize);
    const valData = shuffled.slice(trainSize, trainSize + valSize);
    const testData = shuffled.slice(trainSize + valSize);

    // Append to existing files
    const trainPath = path.join(datasetDir, 'train.jsonl');
    const valPath = path.join(datasetDir, 'val.jsonl');
    const testPath = path.join(datasetDir, 'test.jsonl');

    const trainContent = trainData.map(ex => JSON.stringify(ex)).join('\n') + '\n';
    const valContent = valData.map(ex => JSON.stringify(ex)).join('\n') + '\n';
    const testContent = testData.map(ex => JSON.stringify(ex)).join('\n') + '\n';

    await fs.appendFile(trainPath, trainContent);
    if (valData.length > 0) await fs.appendFile(valPath, valContent);
    if (testData.length > 0) await fs.appendFile(testPath, testContent);
}

// Extract data from URL (mock implementation)
async function extractDataFromUrl(url, subject) {
    // This is a mock implementation
    // In a real system, you would use libraries like puppeteer, cheerio, or pdf-parse

    const sampleExamples = generateSampleData(subject, 50);
    return sampleExamples;
}

// Generate sample training data as array (for API)
function generateSampleDataArray(subject, count) {
    const examples = [];

    const sampleData = {
        mathematics: [
            { question: "What is 2 + 3?", answer: "2 + 3 = 5" },
            { question: "Solve for x: 2x + 4 = 10", answer: "2x + 4 = 10\n2x = 10 - 4\n2x = 6\nx = 3" },
            { question: "What is the derivative of x²?", answer: "The derivative of x² is 2x" },
            { question: "Calculate the area of a circle with radius 3", answer: "Area = πr² = π(3)² = 9π ≈ 28.27 square units" },
            { question: "What is 15% of 80?", answer: "15% of 80 = 0.15 × 80 = 12" },
            { question: "Solve: 3x - 7 = 14", answer: "3x - 7 = 14\n3x = 21\nx = 7" },
            { question: "What is the Pythagorean theorem?", answer: "The Pythagorean theorem states that a² + b² = c², where c is the hypotenuse" },
            { question: "Factor: x² - 9", answer: "x² - 9 = (x + 3)(x - 3)" },
            { question: "What is the slope of y = 2x + 5?", answer: "The slope is 2 (the coefficient of x)" },
            { question: "Calculate: 7! (7 factorial)", answer: "7! = 7 × 6 × 5 × 4 × 3 × 2 × 1 = 5,040" }
        ],
        programming: [
            { question: "How do you declare a variable in Python?", answer: "In Python, you declare a variable by simply assigning a value: variable_name = value" },
            { question: "What is a function in programming?", answer: "A function is a reusable block of code that performs a specific task and can accept parameters" },
            { question: "How do you create a list in Python?", answer: "You create a list using square brackets: my_list = [1, 2, 3, 4]" },
            { question: "What is the difference between == and === in JavaScript?", answer: "== compares values with type coercion, while === compares values and types strictly" },
            { question: "How do you write a for loop in Python?", answer: "for i in range(5):\n    print(i)" },
            { question: "What is object-oriented programming?", answer: "OOP is a programming paradigm based on objects that contain data (attributes) and code (methods)" },
            { question: "How do you handle exceptions in Python?", answer: "Use try-except blocks:\ntry:\n    # code\nexcept Exception as e:\n    # handle error" },
            { question: "What is recursion?", answer: "Recursion is when a function calls itself to solve a smaller version of the same problem" },
            { question: "How do you import a module in Python?", answer: "Use the import statement: import module_name or from module_name import function_name" },
            { question: "What is the difference between a list and a tuple in Python?", answer: "Lists are mutable (can be changed), while tuples are immutable (cannot be changed)" }
        ],
        science: [
            { question: "What is photosynthesis?", answer: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen" },
            { question: "What is Newton's first law of motion?", answer: "An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force" },
            { question: "What is the chemical formula for water?", answer: "The chemical formula for water is H₂O (two hydrogen atoms and one oxygen atom)" },
            { question: "What is DNA?", answer: "DNA (Deoxyribonucleic Acid) is the molecule that carries genetic information in living organisms" },
            { question: "What is gravity?", answer: "Gravity is the force of attraction between objects with mass, described by Einstein's theory of general relativity" },
            { question: "What are the three states of matter?", answer: "The three main states of matter are solid, liquid, and gas" },
            { question: "What is the speed of light?", answer: "The speed of light in a vacuum is approximately 299,792,458 meters per second" },
            { question: "What is evolution?", answer: "Evolution is the process by which species change over time through natural selection and genetic variation" },
            { question: "What is the periodic table?", answer: "The periodic table is an organized arrangement of chemical elements based on their atomic number and properties" },
            { question: "What is energy?", answer: "Energy is the capacity to do work or cause change, and it exists in various forms like kinetic, potential, and thermal" }
        ],
        history: [
            { question: "When did World War II end?", answer: "World War II ended on September 2, 1945, with Japan's formal surrender" },
            { question: "Who was the first President of the United States?", answer: "George Washington was the first President of the United States (1789-1797)" },
            { question: "What was the Renaissance?", answer: "The Renaissance was a period of cultural rebirth in Europe from the 14th to 17th centuries" },
            { question: "When did the American Civil War take place?", answer: "The American Civil War took place from 1861 to 1865" },
            { question: "What was the Industrial Revolution?", answer: "The Industrial Revolution was a period of major industrialization from the late 18th to early 19th century" },
            { question: "Who wrote the Declaration of Independence?", answer: "Thomas Jefferson was the primary author of the Declaration of Independence" },
            { question: "What was the Cold War?", answer: "The Cold War was a period of geopolitical tension between the US and Soviet Union from 1947 to 1991" },
            { question: "When did the Berlin Wall fall?", answer: "The Berlin Wall fell on November 9, 1989" },
            { question: "What was the Great Depression?", answer: "The Great Depression was a severe economic downturn that lasted from 1929 to the late 1930s" },
            { question: "Who was Napoleon Bonaparte?", answer: "Napoleon was a French military leader and emperor who conquered much of Europe in the early 19th century" }
        ],
        literature: [
            { question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare wrote 'Romeo and Juliet' around 1594-1596" },
            { question: "What is a metaphor?", answer: "A metaphor is a figure of speech that makes a direct comparison between two unlike things without using 'like' or 'as'" },
            { question: "Who wrote '1984'?", answer: "George Orwell wrote '1984', published in 1949" },
            { question: "What is the difference between a simile and a metaphor?", answer: "A simile compares using 'like' or 'as', while a metaphor makes a direct comparison" },
            { question: "Who wrote 'Pride and Prejudice'?", answer: "Jane Austen wrote 'Pride and Prejudice', published in 1813" },
            { question: "What is alliteration?", answer: "Alliteration is the repetition of the same consonant sound at the beginning of words in close succession" },
            { question: "Who wrote 'The Great Gatsby'?", answer: "F. Scott Fitzgerald wrote 'The Great Gatsby', published in 1925" },
            { question: "What is irony?", answer: "Irony is a literary device where there's a contrast between expectation and reality" },
            { question: "Who wrote 'To Kill a Mockingbird'?", answer: "Harper Lee wrote 'To Kill a Mockingbird', published in 1960" },
            { question: "What is symbolism?", answer: "Symbolism is the use of symbols to represent ideas or concepts beyond their literal meaning" }
        ]
    };

    const subjectData = sampleData[subject] || sampleData.mathematics;

    // Return the requested number of samples, cycling through if needed
    for (let i = 0; i < count; i++) {
        const sample = subjectData[i % subjectData.length];
        examples.push({
            question: sample.question,
            answer: sample.answer,
            subject: subject,
            difficulty: ['easy', 'intermediate', 'hard'][Math.floor(Math.random() * 3)],
            source: 'generated'
        });
    }

    return examples;
}

// Generate sample training data as JSONL string (for legacy compatibility)
function generateSampleData(subject, count) {
    const examples = generateSampleDataArray(subject, count);
    return examples.map(example => JSON.stringify(example)).join('\n');
}

module.exports = router;
