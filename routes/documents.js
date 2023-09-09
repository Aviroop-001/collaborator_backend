const express = require("express");
const router = express.Router();
const { User, Document } = require("../models/User");

// New document
router.post("/create", async (req, res) => {
  try {
    const userId = req.user.id;
    const newDocument = new Document({
      createdBy: userId,
      title: req.body.title,
      content: req.body.content
    });
    await newDocument.save();

    await User.findByIdAndUpdate(userId, {
      $push: { documents: newDocument._id },
    });

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// fetch doc by id
router.get('/:documentId', async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// fetch doc by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const documents = await Document.find({ createdBy: userId });

    if (!documents || documents.length === 0) {
      res.status(404).json({ error: 'No documents found for this user' });
      return;
    }

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents by user ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
