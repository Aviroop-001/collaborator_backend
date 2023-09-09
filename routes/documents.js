const express = require("express");
const router = express.Router();
const User= require("../models/User");
const Document = require("../models/Document")

// New document
router.post("/create", async (req, res) => {
  try {
    const {userID} = req.body;
    const newDocument = new Document({
      createdBy: userID,
      title: "New Document",
      content: "",
    });
    await newDocument.save();

    await User.findByIdAndUpdate(userID, {
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
    const document = await Document.findById(req.params.documentId).populate("createdBy");

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
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate('documents');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDocuments = user.documents;
    res.status(200).json(userDocuments);
  } catch (error) {
    console.error("Error retrieving user documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const documentId = req.params.id;
    const { title, content } = req.body;
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    document.title = title || document.title;
    document.content = content || document.content;

    await document.save();
    res.status(200).json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
