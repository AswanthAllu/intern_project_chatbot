const path = require("path");
const fs = require('fs').promises;

class VectorStore {
    static cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
    }

    constructor() {
        this.documents = [];
        this.dimension = 384; // For MiniLM
        this.embeddingPipeline = null;
        this.storePath = path.join(__dirname, '..', 'faiss_indices', 'vector_store.json');
        this.pipelineInitialized = false;
        this.pipelineError = null;
        this.batchSize = 5; // Process documents in smaller batches
    }

    async initialize() {
        try {
            await this.loadStore();
            console.log('Vector store initialized');
        } catch (error) {
            console.error('Vector store initialization failed:', error);
            throw error;
        }
    }

    async initPipeline() {
        // If already initialized or failed, return early
        if (this.pipelineInitialized && this.embeddingPipeline) {
            return;
        }
        
        if (this.pipelineError) {
            throw new Error(`Pipeline initialization previously failed: ${this.pipelineError}`);
        }

        try {
            const hfApiKey = process.env.HF_API_KEY;
            if (!hfApiKey) {
                throw new Error('HF_API_KEY not found in environment variables');
            }

            // Add memory management options for ONNX Runtime
            const { pipeline } = await import('@xenova/transformers');
            
            // Configure ONNX Runtime with memory optimization
            const pipelineOptions = {
                token: hfApiKey,
                quantized: true, // Use quantized model for lower memory usage
                progress_callback: null, // Disable progress callbacks to save memory
                cache_dir: path.join(__dirname, '..', 'cache', 'models'), // Cache models locally
            };

            // Set environment variables for ONNX Runtime memory management
            process.env.ORT_GRAPH_OPTIMIZATION_LEVEL = '1'; // Enable basic optimizations
            process.env.ORT_EXECUTION_MODE = 'sequential'; // Use sequential execution to reduce memory

            this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', pipelineOptions);
            this.pipelineInitialized = true;
            console.log('✅ Vector store pipeline initialized with memory optimizations');
        } catch (error) {
            this.pipelineError = error.message;
            console.error('❌ Error initializing vector store pipeline:', error);
            
            // Try fallback to a smaller model
            try {
                console.log('🔄 Attempting fallback to smaller model...');
                const { pipeline } = await import('@xenova/transformers');
                this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/paraphrase-MiniLM-L3-v2', {
                    token: process.env.HF_API_KEY,
                    quantized: true,
                    progress_callback: null,
                });
                this.pipelineInitialized = true;
                console.log('✅ Fallback pipeline initialized successfully');
            } catch (fallbackError) {
                console.error('❌ Fallback pipeline also failed:', fallbackError);
                throw new Error(`Pipeline initialization failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
            }
        }
    }

    async generateEmbedding(text) {
        try {
            if (!this.embeddingPipeline) {
                await this.initPipeline();
            }
            
            // Add memory cleanup before processing
            if (global.gc) {
                global.gc();
            }
            
            const output = await this.embeddingPipeline(text, { 
                pooling: 'mean', 
                normalize: true,
                truncation: true, // Truncate long texts to save memory
                max_length: 512 // Limit text length
            });
            
            const embedding = Array.from(output.data);
            const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            return embedding.map(val => val / magnitude);
        } catch (error) {
            console.error('❌ Error generating embedding:', error);
            
            // If it's a memory error, try to clear the pipeline and retry once
            if (error.message.includes('memory') || error.message.includes('allocation')) {
                console.log('🔄 Memory error detected, clearing pipeline and retrying...');
                this.embeddingPipeline = null;
                this.pipelineInitialized = false;
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    await this.initPipeline();
                    const output = await this.embeddingPipeline(text, { 
                        pooling: 'mean', 
                        normalize: true,
                        truncation: true,
                        max_length: 256 // Even shorter for retry
                    });
                    const embedding = Array.from(output.data);
                    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
                    return embedding.map(val => val / magnitude);
                } catch (retryError) {
                    console.error('❌ Retry also failed:', retryError);
                    throw retryError;
                }
            }
            
            throw error;
        }
    }

    async addDocuments(documents) {
        try {
            console.log(`📄 Processing ${documents.length} documents in batches of ${this.batchSize}`);
            
            const processedDocs = [];
            
            // Process documents in batches to manage memory
            for (let i = 0; i < documents.length; i += this.batchSize) {
                const batch = documents.slice(i, i + this.batchSize);
                console.log(`🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(documents.length / this.batchSize)}`);
                
                const batchResults = await Promise.all(
                    batch.map(async (doc) => {
                        try {
                            const embedding = await this.generateEmbedding(doc.content);
                            return {
                                content: doc.content,
                                embedding,
                                metadata: { ...doc.metadata }
                            };
                        } catch (error) {
                            console.error(`❌ Failed to process document: ${doc.metadata?.source || 'unknown'}`, error.message);
                            // Return null for failed documents
                            return null;
                        }
                    })
                );
                
                // Filter out failed documents
                const successfulResults = batchResults.filter(doc => doc !== null);
                processedDocs.push(...successfulResults);
                
                // Force garbage collection between batches
                if (global.gc) {
                    global.gc();
                }
                
                // Small delay between batches to allow memory cleanup
                if (i + this.batchSize < documents.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            this.documents.push(...processedDocs);
            await this.saveStore();
            console.log(`[VectorStore] Added ${processedDocs.length} documents. Total now: ${this.documents.length}`);
            return { count: processedDocs.length };
        } catch (error) {
            console.error('❌ Error adding documents:', error);
            throw error;
        }
    }
    
    async searchDocuments(query, options = {}) {
        try {
            // Validate input
            if (!query) throw new Error('Query is required');
            if (!options.filters?.userId) throw new Error('userId is required in filters');

            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(query);

            // Apply filters
            let filteredDocs = this.documents.filter(doc => {
                // Always filter by userId
                if (doc.metadata.userId !== options.filters.userId) return false;
                // Only filter by fileId if provided
                if (options.filters.fileId && doc.metadata.fileId !== options.filters.fileId) return false;
                return true;
            });

            // Compute cosine similarity and map results
            const results = filteredDocs.map(doc => {
                const score = VectorStore.cosineSimilarity(queryEmbedding, doc.embedding);
                return { ...doc, score };
            });

            // Sort by score (descending)
            results.sort((a, b) => b.score - a.score);

            // Limit results and format output
            return results.slice(0, options.limit || 5).map(result => ({
                content: result.content,
                metadata: result.metadata,
                score: result.score
            }));
        } catch (error) {
            console.error('❌ Search documents error:', error);
            return [];
        }
    }

    async saveStore() {
        try {
            const dir = path.dirname(this.storePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.storePath, JSON.stringify(this.documents, null, 2));
        } catch (error) {
            console.error('❌ Error saving vector store:', error);
        }
    }

    async loadStore() {
        try {
            const data = await fs.readFile(this.storePath, 'utf8');
            if (data) {
                this.documents = JSON.parse(data);
                console.log(`[VectorStore] Store loaded from ${this.storePath}. Documents: ${this.documents.length}`);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Error loading vector store:', error);
            }
        }
    }
    
    getStatistics() {
        const totalDocs = this.documents.length;
        const stats = {
            totalDocuments: totalDocs,
            pipelineInitialized: this.pipelineInitialized,
            pipelineError: this.pipelineError
        };
        return stats;
    }

    // Method to clear pipeline and free memory
    clearPipeline() {
        if (this.embeddingPipeline) {
            this.embeddingPipeline = null;
            this.pipelineInitialized = false;
            console.log('🧹 Pipeline cleared to free memory');
        }
    }
}

module.exports = VectorStore;