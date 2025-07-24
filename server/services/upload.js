<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { tempAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const File = require('../models/File');
const documentProcessor = require('../documentProcessor');
const vectorStore = require('../vectorStore');
const storage = require('../storage');
const multer = require('multer');

const storageConfig = multer.diskStorage({
  destination: async function (req, res, cb) {
    const assetsDir = path.join(__dirname, '..', 'assets', req.headers['x-user-id']);
    const docsDir = path.join(assetsDir, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    cb(null, docsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${timestamp}${ext}`);
  }
});

const upload = multer({ storage: storageConfig });

router.post('/', tempAuth, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const finalPath = req.file.path;
    const file = new File({
      user: user._id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: finalPath,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    await file.save();

    // Process document and add to vector store
    const chunks = await documentProcessor.processDocument(finalPath, req.file.originalname);
    await vectorStore.addDocuments(chunks.map(chunk => ({
      content: chunk.content,
      metadata: { documentId: file._id.toString(), source: req.file.originalname }
    })));

    // Also save to storage.js for compatibility with previous app
    await storage.createDocument({
      userId: user._id.toString(),
      name: req.file.originalname,
      path: finalPath,
      size: req.file.size
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
=======
// server/routes/upload.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { tempAuth } = require('../middleware/authMiddleware');
const File = require('../models/File');
const User = require('../models/User');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', tempAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { documentProcessor } = req.serviceManager.getServices();
    if (!documentProcessor) {
        console.error("Upload Route: DocumentProcessor not available from serviceManager.");
        return res.status(500).json({ message: 'Server configuration error: DocumentProcessor is not available.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const newFile = new File({
            user: req.user.id,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
        
        const extension = path.extname(req.file.originalname);
        const finalFilename = `${newFile._id}${extension}`;
        const userUploadsDir = path.join(__dirname, '..', 'assets', user.username, 'docs');
        const finalPath = path.join(userUploadsDir, finalFilename);

        fs.mkdirSync(userUploadsDir, { recursive: true });
        fs.writeFileSync(finalPath, req.file.buffer);

        newFile.filename = finalFilename;
        newFile.path = finalPath;
        await newFile.save();

        console.log(`✅ File upload successful for User '${user.username}'.`);
        
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

        res.status(201).json(newFile);

    } catch (error) {
        console.error('Error during file upload process:', error);
        res.status(500).json({ message: 'Server error during file upload.' });
    }
>>>>>>> upstream/main
});

module.exports = router;