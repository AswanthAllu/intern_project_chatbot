<<<<<<< HEAD
<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { tempAuth } = require('../middleware/authMiddleware');
const File = require('../models/File');
const vectorStore = require('../vectorStore');

router.get('/', tempAuth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).select('-path -__v');
    res.status(200).json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', tempAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { originalname } = req.body;

    if (!originalname) {
      return res.status(400).json({ message: 'New filename is required' });
    }

    const file = await File.findOne({ _id: id, user: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.originalname = originalname;
    await file.save();

    res.status(200).json({ message: 'File renamed successfully', file });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', tempAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, user: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await fs.unlink(file.path);
    await File.deleteOne({ _id: id });
    await vectorStore.deleteDocuments({ documentId: id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
=======
// server/routes/files.js

=======
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { tempAuth } = require('../middleware/authMiddleware');
const File = require('../models/File');
const vectorStore = require('../services/LangchainVectorStore');

// GET all files for a user
router.get('/', tempAuth, async (req, res) => {
    try {
        const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
        // --- This format is crucial for the frontend to work correctly ---
        res.status(200).json({ files: files });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PATCH route to update a file's name
router.patch('/:id', tempAuth, async (req, res) => {
    const { newOriginalName } = req.body;
    if (!newOriginalName) {
        return res.status(400).json({ msg: 'New name is required.' });
    }
    try {
        let file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }
        if (file.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        file.originalname = newOriginalName;
        await file.save();
        res.json(file);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a file
router.delete('/:id', tempAuth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ msg: 'File not found in DB' });
        if (file.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        await vectorStore.deleteDocumentsByFileId(req.params.id);
        await File.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'File and all associated data removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
>>>>>>> upstream/main
});

module.exports = router;