const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { tempAuth } = require('../middleware/authMiddleware');
const File = require('../models/File');
const vectorStore = require('../services/LangchainVectorStore');

// GET all files for a user
router.get('/', tempAuth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).select('-path -__v').sort({ createdAt: -1 });
    res.status(200).json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    await fs.unlink(file.path);
    await File.deleteOne({ _id: req.params.id });
    await vectorStore.deleteDocuments({ documentId: req.params.id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
