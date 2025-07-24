<<<<<<< HEAD
// server/routes/upload.js

=======
>>>>>>> upstream/main
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { tempAuth } = require('../middleware/authMiddleware');
const File = require('../models/File');
const User = require('../models/User');
<<<<<<< HEAD
const VectorStore = require('../services/vectorStore');
const vectorStore = require('../services/vectorStoreInstance');
const DocumentProcessor = require('../services/documentProcessor');
const documentProcessor = new DocumentProcessor(vectorStore);

// Configure multer with a file size limit (e.g., 50MB)
const upload = multer({
    storage: multer.memoryStorage(), // Use memory storage to access req.file.buffer
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
    fileFilter: (req, file, cb) => {
        // You can also add file type filters here
        cb(null, true);
    }
});

// @route   POST /api/upload
// @desc    Upload a file, save metadata, rename file to its DB ID, then trigger RAG
=======

// Configure multer to use memory storage. This is more flexible.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// @route   POST /api/upload
// @desc    Upload a file, save metadata, and trigger RAG processing using the central serviceManager
>>>>>>> upstream/main
// @access  Private
router.post('/', tempAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

<<<<<<< HEAD
=======
    // Get the documentProcessor from the serviceManager injected into the request
    const { documentProcessor } = req.serviceManager.getServices();
    if (!documentProcessor) {
        console.error("Upload Route: DocumentProcessor not available from serviceManager.");
        return res.status(500).json({ message: 'Server configuration error: DocumentProcessor is not available.' });
    }

>>>>>>> upstream/main
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

<<<<<<< HEAD
        // 1. Create the database record first to get the unique _id
=======
>>>>>>> upstream/main
        const newFile = new File({
            user: req.user.id,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
<<<<<<< HEAD
            // We will set the final filename and path in the next steps
        });
        
        // 2. Determine the final filename and path using the new _id
=======
        });
        
>>>>>>> upstream/main
        const extension = path.extname(req.file.originalname);
        const finalFilename = `${newFile._id}${extension}`;
        const userUploadsDir = path.join(__dirname, '..', 'assets', user.username, 'docs');
        const finalPath = path.join(userUploadsDir, finalFilename);

<<<<<<< HEAD
        // Ensure the directory exists
        fs.mkdirSync(userUploadsDir, { recursive: true });

        // 3. Write the file from memory to the disk with its final name
        fs.writeFileSync(finalPath, req.file.buffer);

        // 4. Update the database record with the final filename and path
=======
        fs.mkdirSync(userUploadsDir, { recursive: true });
        fs.writeFileSync(finalPath, req.file.buffer);

>>>>>>> upstream/main
        newFile.filename = finalFilename;
        newFile.path = finalPath;
        await newFile.save();

<<<<<<< HEAD
        console.log(`✅ File upload successful for User '${user.username}'. Final filename: ${finalFilename}.`);
        
        // 5. Process the document and add it to the vector store for RAG
        try {
            console.log(`🔄 Processing document for RAG: ${req.file.originalname}`);
            const processingResult = await documentProcessor.processFile(finalPath, {
                userId: req.user.id,
                fileId: newFile._id.toString(),
                originalName: req.file.originalname,
                fileType: path.extname(req.file.originalname).substring(1)
            });
            
            console.log(`✅ RAG processing completed for '${req.file.originalname}': ${processingResult.chunksAdded} chunks added`);
        } catch (ragError) {
            console.error(`❌ RAG processing failed for '${req.file.originalname}':`, ragError.message);
            // Don't fail the upload if RAG processing fails
        }
=======
        console.log(`✅ File upload successful for User '${user.username}'.`);
        
        // Asynchronously process the document for RAG. We don't need to wait for this.
        documentProcessor.processFile(finalPath, {
            userId: req.user.id.toString(),
            fileId: newFile._id.toString(),
            originalName: req.file.originalname,
            fileType: path.extname(req.file.originalname).substring(1)
        }).then(result => {
            console.log(`✅ RAG processing started for '${req.file.originalname}'.`);
        }).catch(ragError => {
            console.error(`❌ RAG processing failed for '${req.file.originalname}':`, ragError.message);
        });
>>>>>>> upstream/main

        res.status(201).json(newFile);

    } catch (error) {
        console.error('Error during file upload process:', error);
        res.status(500).json({ message: 'Server error during file upload.' });
    }
});

<<<<<<< HEAD
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File is too large. The maximum size is 50MB.' });
    }
    next(err);
}

=======
>>>>>>> upstream/main
module.exports = router;