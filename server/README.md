# iMentor Server

## Memory Management for RAG Processing

This server includes advanced memory management features to handle ONNX Runtime memory allocation issues during RAG (Retrieval-Augmented Generation) processing.

### Quick Start Options

#### For Memory-Constrained Systems:
```bash
# Start with garbage collection and skip RAG reprocessing
npm run start:gc-no-rag

# Or set environment variable
SKIP_RAG_REPROCESSING=true npm start
```

#### For Normal Operation:
```bash
# Standard start
npm start

# With garbage collection enabled
npm run start:gc
```

### Memory Management Features

#### 1. Batch Processing
- Files are processed in small batches (3 files at a time)
- Delays between batches allow memory cleanup
- Large files (>50MB) are automatically skipped

#### 2. ONNX Runtime Optimizations
- Quantized models for lower memory usage
- Sequential execution mode
- Local model caching
- Automatic fallback to smaller models

#### 3. Error Recovery
- Automatic pipeline clearing on memory errors
- Retry mechanism with reduced text length
- Graceful degradation when models fail to load

### Environment Variables

Add these to your `.env` file:

```env
# Skip RAG reprocessing at startup
SKIP_RAG_REPROCESSING=true

# Hugging Face API key for embeddings
HF_API_KEY=your_hf_api_key_here

# Gemini API key for chat
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB connection string
MONGO_URI=your_mongodb_connection_string
```

### Available Scripts

```bash
# Start server with different memory options
npm start                    # Standard start
npm run start:gc            # With garbage collection
npm run start:no-rag        # Skip RAG reprocessing
npm run start:gc-no-rag     # Both optimizations

# Development with nodemon
npm run dev                 # Standard dev
npm run dev:gc             # With garbage collection
npm run dev:no-rag         # Skip RAG reprocessing

# RAG processing scripts
npm run rag:process        # Process existing files
npm run rag:process:gc     # Process with garbage collection
npm run rag:diagnose       # Diagnose memory issues
```

### Troubleshooting Memory Issues

#### 1. Run Memory Diagnosis
```bash
npm run rag:diagnose
```

This will show:
- System memory information
- File sizes and counts
- Environment variable status
- Recommendations for your setup

#### 2. Common Solutions

**If you get ONNX memory allocation errors:**
```bash
# Option 1: Skip RAG processing at startup
npm run start:no-rag

# Option 2: Use garbage collection
npm run start:gc-no-rag

# Option 3: Process files later in smaller batches
npm run rag:process:gc
```

**If you have large files:**
- Files >50MB are automatically skipped during startup
- Process them manually later using the RAG processing scripts
- Consider splitting large files into smaller chunks

#### 3. Advanced Memory Management

**Enable garbage collection:**
```bash
# Add --expose-gc flag to enable manual garbage collection
node --expose-gc server.js
```

**Set Node.js memory limits:**
```bash
# Limit heap size (adjust based on your system)
node --max-old-space-size=2048 server.js
```

### File Processing Strategy

1. **Startup Processing**: Only processes files <50MB in small batches
2. **Manual Processing**: Use `npm run rag:process` for all files
3. **Batch Processing**: Files processed 3 at a time with 2-second delays
4. **Error Handling**: Failed files are logged but don't stop processing
5. **Memory Cleanup**: Garbage collection between batches

### Performance Tips

1. **For low-memory systems (<8GB RAM):**
   - Use `npm run start:gc-no-rag`
   - Process files manually later
   - Consider upgrading system memory

2. **For medium-memory systems (8-16GB RAM):**
   - Use `npm run start:gc`
   - Monitor memory usage during processing
   - Skip very large files

3. **For high-memory systems (>16GB RAM):**
   - Use standard `npm start`
   - Can handle larger files and batches
   - May still benefit from garbage collection

### Monitoring

Watch the console output for:
- `✅ Vector store pipeline initialized with memory optimizations`
- `🔄 Processing batch X/Y`
- `⏳ Waiting Xs before next batch...`
- `🧹 Pipeline cleared to free memory`

### Support

If you continue to experience memory issues:
1. Run `npm run rag:diagnose` for detailed information
2. Check your system's available memory
3. Consider using a cloud service with more RAM
4. Split large documents into smaller files
5. Use the skip RAG option and process files manually 