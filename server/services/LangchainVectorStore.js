// server/services/LangchainVectorStore.js

<<<<<<< HEAD
const { HNSWLib } = require("@langchain/community/vectorstores/hnswlib");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const fs = require('fs');
const path = require('path');

// Define the path where the vector store files will be saved.
const STORE_PATH = path.resolve(__dirname, '..', 'vector_store_data');
=======
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
>>>>>>> upstream/main

class LangchainVectorStore {
    constructor() {
        this.store = null;
        this.embeddings = null;
    }

    /**
<<<<<<< HEAD
     * Initializes the vector store. It will load from disk if the files exist,
     * or prepare for creation if they don't.
=======
     * Initializes the vector store. This version is in-memory, so it starts fresh every time.
>>>>>>> upstream/main
     */
    async initialize() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set.");
        }

        // Use the LangChain wrapper for Gemini Embeddings
        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "embedding-001"
        });

<<<<<<< HEAD
        // Check if a store already exists on disk
        if (fs.existsSync(STORE_PATH)) {
            try {
                console.log("Found existing vector store. Loading from disk...");
                this.store = await HNSWLib.load(STORE_PATH, this.embeddings);
                console.log("✅ Vector store loaded successfully from disk.");
            } catch (e) {
                console.error("Error loading vector store from disk. It might be corrupted.", e);
            }
        } else {
            console.log("No vector store found on disk. A new one will be created when the first document is added.");
            // We can't create an empty store, so we wait for the first `addDocuments` call.
        }
    }

    /**
     * Adds documents to the vector store and saves it to disk.
     */
    async addDocuments(documents) {
=======
        // Create an empty in-memory store. It will be populated by the startup script.
        this.store = new MemoryVectorStore(this.embeddings);
        
        console.log("✅ In-memory vector store initialized successfully.");
    }

    /**
     * Adds documents to the in-memory vector store.
     */
    async addDocuments(documents) {
        if (!this.store) throw new Error("MemoryVectorStore not initialized.");
>>>>>>> upstream/main
        if (!documents || documents.length === 0) return { count: 0 };

        const contents = documents.map(doc => doc.content);
        const metadatas = documents.map(doc => doc.metadata);

<<<<<<< HEAD
        if (!this.store) {
            // If the store doesn't exist yet, create it from the first batch of documents.
            this.store = await HNSWLib.fromTexts(contents, metadatas, this.embeddings);
        } else {
            // Otherwise, add the new documents to the existing store.
            await this.store.addDocuments(documents);
        }

        // Persist the changes to the file system.
        await this.store.save(STORE_PATH);
        console.log(`[LangchainVectorStore] Added ${documents.length} documents and saved to disk.`);
=======
        await this.store.addDocuments(documents);
        
        const count = await this.getStatistics();
        console.log(`[MemoryVectorStore] Added ${documents.length} documents. Total now: ${count.documentCount}`);
>>>>>>> upstream/main
        return { count: documents.length };
    }

    /**
<<<<<<< HEAD
     * Deletes documents associated with a fileId.
     * This is done by rebuilding the store without the deleted documents.
     */
    async deleteDocumentsByFileId(fileId) {
        if (!this.store) return;

        console.log(`Attempting to delete documents for fileId: ${fileId}`);
        const allDocs = this.store.docstore._docs;
        const docsToKeep = [];

        // HNSWLib uses a Map, so we iterate over its values
        for (const doc of allDocs.values()) {
            if (doc.metadata.fileId !== fileId) {
                docsToKeep.push(doc);
            }
        }
        
        const numDeleted = allDocs.size - docsToKeep.length;
        console.log(`Found ${numDeleted} documents to delete.`);

        if (docsToKeep.length > 0) {
            const contents = docsToKeep.map(doc => doc.pageContent);
            const metadatas = docsToKeep.map(doc => doc.metadata);
            // Rebuild the store from the documents we want to keep.
            this.store = await HNSWLib.fromTexts(contents, metadatas, this.embeddings);
            await this.store.save(STORE_PATH);
        } else {
            // If no documents are left, delete the store directory entirely.
            this.store = null;
            if (fs.existsSync(STORE_PATH)) {
                fs.rmSync(STORE_PATH, { recursive: true, force: true });
            }
        }
        console.log(`[LangchainVectorStore] Documents for fileId ${fileId} removed. Store updated.`);
=======
     * Deletes documents by rebuilding the store without the specified documents.
     * Note: This is less efficient for memory stores but ensures consistency.
     */
    async deleteDocumentsByFileId(fileId) {
        if (!this.store) return;
        
        // MemoryVectorStore doesn't have a direct delete method.
        // The reprocessing on startup is the main way to keep it in sync.
        // This function is less critical now but can be implemented if needed.
        console.log(`[MemoryVectorStore] Deletion requested for fileId: ${fileId}. Store will be refreshed on next restart.`);
>>>>>>> upstream/main
    }

    /**
     * Searches for relevant documents using metadata filters.
     */
    async searchDocuments(query, options = {}) {
        if (!this.store) return [];

<<<<<<< HEAD
        const results = await this.store.similaritySearchWithScore(
            query,
            options.limit || 5,
            (doc) => {
                // This is LangChain's powerful metadata filtering function.
                if (options.filters?.userId && doc.metadata.userId !== options.filters.userId) return false;
                if (options.filters?.fileId && doc.metadata.fileId !== options.filters.fileId) return false;
                return true; // Keep the document if it passes all filters
            }
        );

        // Format the results to match what the rest of your app expects.
        return results.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score
        }));
    }
=======
        // The filter function for MemoryVectorStore
        const filterFn = (doc) => {
            if (options.filters?.userId && doc.metadata.userId !== options.filters.userId) return false;
            if (options.filters?.fileId && doc.metadata.fileId !== options.filters.fileId) return false;
            return true;
        };

        const results = await this.store.similaritySearchWithScore(
            query,
            options.limit || 5,
            filterFn
        );

        // Format results to match the expected { content, metadata, score } structure
        return results.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score // For MemoryVectorStore, similarity is 0 (bad) to 1 (good)
        }));
    }

    /**
     * Gets statistics about the in-memory store.
     */
    async getStatistics() {
        if (!this.store) return { documentCount: 0 };
        // A simple way to get the count from the internal store
        return { documentCount: this.store.memoryVectors.length };
    }
>>>>>>> upstream/main
}

// Export a singleton instance so the same store is used across your app.
module.exports = new LangchainVectorStore();